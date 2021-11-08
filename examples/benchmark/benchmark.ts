import { getJSSolver } from "../../src/api/js";

function runBenchmark() {
  getJSSolver().then(async (solver) => {
    const buf = new Uint8Array(128);
    buf.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 255, 230, 210, 255, 255, 255, 255]); // At least add a few non-zero values in buffer

    const start = new Date().getTime();
    console.time("total benchmark time");

    const N = 25_000;
    let i = 0;

    const f = () => {
      const startStep = new Date().getTime();
      solver(new Uint8Array(128), 0, N);
      const timeElapsed = (new Date().getTime() - startStep) * 0.001;
      document.body.innerHTML += `<p>Hashrate ${N / timeElapsed / 1000} KH/s </p>`;

      i++;
      if (i < 20) {
        setTimeout(() => f());
      } else {
        console.timeEnd("total benchmark time");
        console.log("Done");
      }
    };

    f();
  });
}

runBenchmark();
