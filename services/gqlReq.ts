
const gqlRequest = (data: any, axiosConfig?: any) => {
  const { headers, ...otherAxiosConfig } = axiosConfig || {};
  return fetch("/1.1", {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/graphql',
      ...headers
    },
    body: data,
    ...otherAxiosConfig
  }).catch((e) => {
    return Promise.resolve(e.response);
  }); //在因权限问题部分数据无法获取时返回正常部分
};

const isObject = (val: any) => {
  return Object.prototype.toString.call(val) === '[object Object]';
};
const canConvertNumber = (val: any) => typeof val === 'string' && !isNaN(Number(val));
const obj2gqlString = (obj: any) => {
  let ret = '';
  Object.keys(obj).forEach((key, index) => {
    ret +=
      obj[key] !== undefined
        ? `${key}:${isObject(obj[key])
          ? `{${obj2gqlString(obj[key])}}`
          : canConvertNumber(obj[key])
            ? Number(obj[key])
            : Array.isArray(obj[key]) && obj[key].some((item: any) => isObject(item))
              ? `[${obj[key].map((i: any) => `{${obj2gqlString(i)}}`)}]`
              : JSON.stringify(obj[key])
        }`
        : '';
    if (index !== Object.keys(obj).length - 1) {
      ret += ',';
    }
  });
  return ret.replace(/'/g, ''); //解决之前版本gql写法问题;
};

function fieldsArrToString(arr: any) {
  return arr
    .map((item: any) => {
      if (typeof item !== 'string') {
        return item[0] + '{' + fieldsArrToString(item[1]) + '}';
      }
      return item;
    })
    .join(',');
}

/**
 * fib-app graphql查询
 * 文档：https://github.com/fibjs/fib-app/blob/master/docs/zh/guide.md
 * @param {string} tableName 表名
 * @return {*} {find, count, findAll}
 */
const gqlReq = (tableName: any) => {
  /**
   * 查询
   * @param {ICondition} condition 条件
   * @param {string} fields 需要的字段
   * @param {AxiosRequestConfig} [axiosConfig] axios配置项
   * @return {*}  {data:{find_(tableName):[]}}
   *
   * - example
   * ```javascript
   *  gqlReq("review_record").find(
          {
              where: {
                  company_id:1
              },
              findby: {//慎用
                      extend: "'staff'",
                      where: {
                          name: {
                              like: `'%${name}%'`,
                          },
                      },
              },
              order:"-id"
              limit:10,
              skip:10,
          },
          `{id,createdAt}`
      );
   * ```
   */
  const find = (condition: any, fields = '{}', axiosConfig = {}) => {
    const getGqlData = (condition: any) =>
      `{find_${tableName}(${condition ? obj2gqlString(condition) : 'where:{}'})${typeof fields === 'string' ? fields : `{${fieldsArrToString(fields)}}` //兼容[x,[x,x]]写法
      }}`;
    if (condition?.limit && condition.limit > 1000) {
      // 解决 gql limit 1000条限制
      // 拆分limit
      const oneRequestLimit = 500; //一个请求的limit
      const all = condition.limit;
      let rest = all % oneRequestLimit;
      let recordLimits = new Array((all - rest) / oneRequestLimit).fill(oneRequestLimit);
      recordLimits.push(rest);

      return Promise.all(
        recordLimits.map((limit, index) => {
          return gqlRequest(
            getGqlData({
              ...condition,
              limit,
              skip: index * oneRequestLimit
            })
          )
        })
      )
        .then((res) => {
          const ret = res[0];
          for (let i = 1; i < res.length; i++) {
            ret.data.data[`find_${tableName}`].push(...res[i].data.data[`find_${tableName}`]);
          }
          return ret;
        })
        .catch((err) => {
          return err;
        });
    } else {
      return gqlRequest(getGqlData(condition), axiosConfig);
    }
  };
  /**
   * 获取总数
   * @param {ICondition} condition 条件
   * @param {AxiosRequestConfig} [axiosConfig] axios配置项
   * @return {*}  {data:{count_(tableName):number}}
   *
   * - example
   * ```javascript
   *  gqlReq("review_record").count(
          {
              where: {
                  company_id:1
              },
              findby: {//慎用
                      extend: "'staff'",
                      where: {
                          name: {
                              like: `'%${name}%'`,
                          },
                      },
              },
          }
      );
   * ```
   */
  const count = (condition: any, axiosConfig?: any) => {
    const gqlData = `{count_${tableName}(${condition ? obj2gqlString(condition) : 'where:{}'})}`;
    return gqlRequest(gqlData, axiosConfig);
  };
  /**
   * 查询所有 类似find
   * @param {ICondition} condition 条件
   * @param {string} fields 需要的字段
   * @param {AxiosRequestConfig} [axiosConfig] axios配置项
   * @return {*}  {data:{find_(tableName):[]}}
   *
   * - example
   * ```javascript
   *  gqlReq("review_record").findAll(
          {
              where: {
                  company_id:1
              },
              findby: {//慎用
                      extend: "'staff'",
                      where: {
                          name: {
                              like: `'%${name}%'`,
                          },
                      },
              },
              order:"-id"
              limit:10,//无需传，传了也会被覆盖为总数
              skip:10,
          },
          `{id,createdAt}`
      );
   * ```
   */
  const findAll = async (condition: any, fields = '{}', axiosConfig: any) => {
    if (condition?.limit) {
      delete condition.limit;
    }
    const ret = await count(condition, axiosConfig);
    const totalCount = ret.data.data[`count_${tableName}`];
    return find({ ...condition, limit: totalCount }, fields, axiosConfig);
  };

  /**
   * 分页查询
   * @param {ICondition} condition 条件
   * @param {string} fields 需要的字段
   * @param {AxiosRequestConfig} [axiosConfig] axios配置项
   * @return {*}  {results: RetItemType[];count: number;}
   *
   */
  const paging = (condition: any, fields: any, axiosConfig: any) => {
    const getGqlData = (condition: any) =>
      `{paging_${tableName}(${condition ? obj2gqlString(condition) : 'where:{}'}){
                results${fields || {}}
                count
            }}`;

    return gqlRequest(getGqlData(condition), axiosConfig).then((queryRet) => {
      return new Promise((resolve, reject) => {
        const isQueryError = queryRet.data?.errors?.length > 0;
        if (isQueryError) {
          reject(queryRet.data.errors);
        } else {
          const ret = queryRet.data.data[`paging_${tableName}`];
          if (ret) {
            resolve(queryRet);
          } else {
            reject('error');
          }
        }
      });
    });
  };
  return {
    find,
    count,
    findAll,
    paging
  };
};

export default gqlReq;
