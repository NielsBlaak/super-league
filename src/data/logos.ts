import type { StaticImageData } from "next/image";
import ars from "@/assets/logos/ars.svg";
import atm from "@/assets/logos/atm.svg";
import bar from "@/assets/logos/bar.svg";
import bay from "@/assets/logos/bay.svg";
import int from "@/assets/logos/int.svg";
import liv from "@/assets/logos/liv.svg";
import mci from "@/assets/logos/mci.svg";
import mun from "@/assets/logos/mun.svg";
import psg from "@/assets/logos/psg.svg";
import rma from "@/assets/logos/rma.svg";

// Source: football-logos.cc. The files are in src/assets/logos and the file name is the team ID.
// The logos belong to the clubs. See the README for the terms of use.
export const logos: Record<string, StaticImageData> = {
  ars,
  psg,
  bar,
  rma,
  mci,
  bay,
  liv,
  atm,
  mun,
  int,
};
