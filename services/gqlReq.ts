
const gqlRequest = (data: any, axiosConfig?: any) => {
  const { headers, ...otherAxiosConfig } = axiosConfig || {};
  return fetch("/2.1", {
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
  });
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
  return ret.replace(/'/g, '');
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
 * @param {string} tableName
 * @return {*} {find, count, findAll}
 */
const gqlReq = (tableName: any) => {
  const find = (condition: any, fields = '{}', axiosConfig = {}) => {
    const getGqlData = (condition: any) =>
      `{find_${tableName}(${condition ? obj2gqlString(condition) : 'where:{}'})${typeof fields === 'string' ? fields : `{${fieldsArrToString(fields)}}`
      }}`;
    if (condition?.limit && condition.limit > 1000) {
      const oneRequestLimit = 500;
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
  const count = (condition: any, axiosConfig?: any) => {
    const gqlData = `{count_${tableName}(${condition ? obj2gqlString(condition) : 'where:{}'})}`;
    return gqlRequest(gqlData, axiosConfig);
  };
  const findAll = async (condition: any, fields = '{}', axiosConfig: any) => {
    if (condition?.limit) {
      delete condition.limit;
    }
    const ret = await count(condition, axiosConfig);
    const totalCount = ret.data.data[`count_${tableName}`];
    return find({ ...condition, limit: totalCount }, fields, axiosConfig);
  };

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
