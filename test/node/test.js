const tmp = [1,2,3,4,5,6,7,8,9,10, 11]
const n = 1;
const m = tmp.length;
const jump = Math.round(m / n);
console.log(jump);
for (let i = 0; i < m; i = i + jump) {
  console.log(i, i + jump);
  console.log(tmp.slice(i, i + jump));
}