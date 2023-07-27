
const reformChainError = (error: any) => {
  let errorObject = error;
  let str = '';
  if (typeof errorObject === 'string') {
    errorObject = JSON.parse(errorObject);
  }
  if (errorObject?.code === 1010 && errorObject?.descript === 'User rejected the signature request') {
    str = 'Cancelled signature request'
  } else if (errorObject && errorObject.error) {
    const error = errorObject.error;
    if (
      error.name === 'expired_tx_exception' &&
      error.what === 'Expired Transaction'
    ) {
      str = 'Expired Transaction'
    } else if (error.details && error.details.length > 0) {
      const details = error.details;
      str = details[0].message
    } else {
      try {
        str = (error || '').toString();
      } catch (error) {
        str = JSON.stringify(error);
      }
    }
  } else {
    str = JSON.stringify(error);
  }
  return str;
};

export { reformChainError };
