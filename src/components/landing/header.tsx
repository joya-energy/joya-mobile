"use client";

import Image from "next/image";
import Link from "next/link";
import logoBig from "@/assets/logo_big.webp";
import { JOYA_MARKETING_LANDING_URL } from "@/lib/landing/urls";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  return (
    <header className=" top-0 z-30 h-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/40 shadow-sm animate-fade-in">
      <div className="max-w-[1600px] mx-auto px-4 xs:px-6 sm:px-8 h-full flex justify-between items-center w-full">
        <Link
          href={JOYA_MARKETING_LANDING_URL}
          className="flex shrink-0 items-center rounded-md transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary/40"
          aria-label="Retour au site Joya Energy"
        >
          <Image
            src={logoBig}
            alt="Joya Energy"
            width={130}
            height={130}
            className="w-24 h-24 xs:w-28 xs:h-28 sm:w-[130px] sm:h-[130px] object-contain"
            priority
          />
        </Link>
        <div>
          <Button
            variant="outline"
            className="bg-landing-primary text-white hover:bg-landing-primary-dark border-0 h-9 sm:h-10 px-4 sm:px-6 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]"
            onClick={() => router.push("/auth/login")}
          >
            Connexion
          </Button>
        </div>
      </div>
    </header>
  );
}
