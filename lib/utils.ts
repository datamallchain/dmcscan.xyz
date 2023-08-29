import BigNumber from "bignumber.js";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function emoji(country: any) {
  const offset = 127397;
  const A = 65;
  const Z = 90;

  const f = country.codePointAt(0);
  const s = country.codePointAt(1);

  if (
    country.length !== 2
    || f > Z || f < A
    || s > Z || s < A
  ) {
    // throw new Error('Not an alpha2 country code');
    return '--'
  }

  return String.fromCodePoint(f + offset)
    + String.fromCodePoint(s + offset);
}

export function ramSizeFormat(ramSize: number) {
  if (!ramSize && ramSize !== 0) {
    return '--'
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let index = 0;
  while (ramSize >= 1024 && index < units.length - 1) {
    ramSize /= 1024;
    index++;
  }
  return new BigNumber(ramSize).toFixed(2, 1) + " " + units[index];
}

export function cpuSizeFormat(cpuSize: number) {
  if (!cpuSize && cpuSize !== 0) {
    return '--'
  }
  const units = ['MS', 'S'];
  let index = 0;
  while (cpuSize >= 1000 && index < units.length - 1) {
    cpuSize /= 1000;
    index++;
  }
  return new BigNumber(cpuSize).toFixed(2, 1) + " " + units[index];
}

export function netSizeFormat(netSize: number) {
  if (!netSize && netSize !== 0) {
    return '--'
  }
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let index = 0;
  while (netSize >= 1024 && index < units.length - 1) {
    netSize /= 1024;
    index++;
  }
  return new BigNumber(netSize).toFixed(2, 1) + " " + units[index];
}

function char_to_symbol(c: any) {
  if (c >= 97 && c <= 122) return (c - 97) + 6
  if (c >= 49 && c <= 53) return (c - 49) + 1
  return 0
}

export function reformAccount(account: string) {
  const len = account.length

  let value = new BigNumber(0)

  for (let i = 0; i <= 12; ++i) {
    let c = 0
    if (i < len && i <= 12) {
      c = char_to_symbol(account.charCodeAt(i))
    }

    if (i < 12) {
      c &= 0x1f
      let b_c = new BigNumber(c)
      const two = new BigNumber(2)
      b_c = b_c.times(two.pow(64 - 5 * (i + 1)))
      value = value.plus(b_c)
    } else {
      c &= 0x0f
      value = value.plus(c)
    }
  }

  return value.toFixed()
}

export const reformAmount = (value: any, bit: any) => {
  let str = value.toString();
  let strIndex = str.indexOf(".");
  if (strIndex === -1) return Number(str).toFixed(bit);
  str =
    strIndex === strIndex + bit
      ? str.substring(0, strIndex + bit)
      : str
        .substring(0, strIndex + bit + 1)
        .padEnd(strIndex + bit + 1, 0);
  return str;
};

export const numberToThousands = (num: number | string) => {
  if (num === undefined) {
    return '--'
  }
  const parts = num.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export const isMobile = () => {
  if (typeof window !== 'undefined') {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad'];
    return mobileKeywords.some(keyword => userAgent.includes(keyword));
  }
  return false;
}
