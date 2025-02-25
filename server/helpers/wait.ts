function waitForNSeconds(seconds: number) {
  return new Promise((res, _) => {
    setTimeout(() => {
      res(`waited for ${seconds} seconds`);
    }, 1000 * seconds);
  });
}

export { waitForNSeconds };
