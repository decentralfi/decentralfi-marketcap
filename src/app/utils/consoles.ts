export const consoleLog = (...message) => {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    console.log(message);
  }
};
