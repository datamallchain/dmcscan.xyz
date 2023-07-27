
export { default as gqlReq } from './gqlReq';

// const BASE_URL = '1.1'
// export function baseJSONHTTPRequest(args) {
//   const { headers, ...restArgs } = args;
//   return axios({
//     baseURL: BASE_URL,
//     method: 'POST',
//     url: '/1.0/app',
//     withCredentials: true,
//     headers: {
//       'Content-Type': 'application/json',
//       ...headers
//     },
//     ...restArgs
//   });
// }


// function baseGraphQLRequest(params, urlparams?, responseType?) {
//   return axios({
//     baseURL: BASE_URL,
//     method: 'POST',
//     url: '/1.0/app',
//     withCredentials: true,
//     headers: {
//       'Content-Type': 'application/graphql'
//       // Authentication: token,
//     },
//     data: params,
//     params: urlparams,
//     responseType
//   }).catch((e) => {
//     return Promise.resolve(e.response);
//   });
// }

// // orders list
// function findOrdersList(val) {
//   const params = `
//     {
//         find_material(
//           where: {
//              ${val?.lte && val?.gte
//       ? `
//             createdAt:{
//               gte:"${val?.lte}",
//               lte:"${val.gte}"
//             }`
//       : ''
//     }
//           }
//           order: "-createdAt,id"
//           ${val.limit ? `limit: ${val.limit}` : ''}
//           ${val.skip ? `skip: ${val.skip}` : ''}
//         ){
//           id
//           title
//           content
//           image_urls
//           video_urls
//           hash
//           status
//           createdAt
//           platform_auth{
//             id
//             name
//             platform{
//               name
//             }
//           }
//           foreign_url
//           foreign_id
//           review{
//             id
//             status
//             updatedAt
//             request_created
//             request_staff{
//               name
//               account
//             }
//             publish_created
//             publish_staff{
//               name
//               account
//             }
//             company{
//               name
//             }
//           review_step{
//             id
//             weight
//             status
//             updatedAt
//             review_staff{
//               staff_weight
//               updatedAt
//               id
//               status
//               staff{
//                 name
//                 company{
//                   name
//                 }
//               }
//             }
//           }
//           }
//           updatedAt
//         }
//     }
//     `;

//   return baseGraphQLRequest(params);
// }


// export {
//   baseGraphQLRequest,
//   findOrdersList,
// };
