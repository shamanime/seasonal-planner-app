"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const REPOSITORY_URL = "https://github.com/shamanime/seasonal-planner-app";

export function SiteFooter() {
	const pathname = usePathname();

	if (pathname.endsWith("/kiosk")) {
		return null;
	}

	return (
		<footer className="no-print mt-auto px-5 py-8 text-center text-sm text-ink/70">
			<p>
				Proudly made in Canada 🇨🇦 ·{" "}
				<Link
					href={REPOSITORY_URL}
					target="_blank"
					rel="noreferrer"
					className="font-medium text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink"
				>
					View the source on GitHub
				</Link>
			</p>
		</footer>
	);
}
