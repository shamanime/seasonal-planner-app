import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		encoding: "utf8",
		stdio: options.capture ? "pipe" : "inherit",
		...options,
	});

	if (result.status !== 0) {
		if (options.capture) {
			process.stderr.write(result.stdout ?? "");
			process.stderr.write(result.stderr ?? "");
		}
		process.exit(result.status ?? 1);
	}

	return result.stdout ?? "";
}

if (!process.env.CI) {
	run("npm", ["exec", "--", "playwright", "install", "chromium"]);
}
run("npm", [
	"exec",
	"--",
	"supabase",
	"start",
	"--exclude",
	"edge-runtime,imgproxy,logflare,mailpit,postgres-meta,realtime,storage-api,studio,supavisor,vector",
]);

const status = run("npm", ["exec", "--", "supabase", "status", "-o", "env"], {
	capture: true,
});
const localEnv = Object.fromEntries(
	status
		.split("\n")
		.map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
		.filter(Boolean)
		.map((match) => [match[1], match[2]]),
);

const env = {
	...process.env,
	APP_URL: "http://127.0.0.1:3000",
	NEXT_PUBLIC_SUPABASE_URL: localEnv.API_URL,
	NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
		localEnv.PUBLISHABLE_KEY ?? localEnv.ANON_KEY,
	SUPABASE_SERVICE_ROLE_KEY: localEnv.SERVICE_ROLE_KEY,
};

for (const name of [
	"NEXT_PUBLIC_SUPABASE_URL",
	"NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
	"SUPABASE_SERVICE_ROLE_KEY",
]) {
	if (!env[name]) {
		console.error(`Supabase status did not provide ${name}.`);
		process.exit(1);
	}
}

const separator = process.argv.indexOf("--");
const playwrightArgs =
	separator === -1 ? [] : process.argv.slice(separator + 1);
const result = spawnSync(
	"npm",
	["exec", "--", "playwright", "test", ...playwrightArgs],
	{ env, stdio: "inherit" },
);

process.exit(result.status ?? 1);
