const KnownArchitectures = ["arm64", "x64"];
const KnownOperatingSystems = ["linux", "windows", "darwin"];
const InvalidCombinations = ["windows-arm64"];

outer: for (const arch of KnownArchitectures) {
  for (const platform of KnownOperatingSystems) {
    if (InvalidCombinations.includes(`${platform}-${arch}`)) continue;

    // compile the given architecture
    const target = `bun-${platform}-${arch}-modern`;
    const args = [
      "bun",
      "build",
      "./src/cli.ts",
      `--outfile=dist/${target}-ptcli`,
      "--compile",
      "--minify",
      //   "--bytecode",
      "--env=disable",
      "--sourcemap=none",
      `--target=${target}`,
    ];

    const proc = Bun.spawn(args, {
      env: process.env,
      cwd: process.cwd(),
      stderr: "inherit",
      stdout: "inherit",
      stdin: "inherit",
    });
    const result = await proc.exited;
    if (result !== 0) {
      break outer;
    }
  }
}
