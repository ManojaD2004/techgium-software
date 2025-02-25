function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randNum(min: number, max: number) {
  return Math.random() * (max - min + 1) + min;
}

export { randInt, randNum };
