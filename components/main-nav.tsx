'use client'
import * as React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { NavItem } from "@/types/nav"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useRouter, usePathname } from 'next/navigation';
import BigNumber from "bignumber.js"
import logo from "../public/logo.png";
import Image from 'next/image';

interface MainNavProps {
  items?: NavItem[]
}
export function MainNav({ items }: MainNavProps) {
  const router = useRouter()
  const [activeItem, setActiveItem] = useState('Home');
  const [searchText, setSearchText] = useState('');
  const pathname = usePathname()

  useEffect(() => {
    const path = pathname.split('/').length > 1 ? pathname.split('/')[1] : 'home'
    setActiveItem(path || 'home')
  }, [pathname])

  const handleEnterPress = (event: any) => {
    if (event.keyCode === 13) {
      if (new BigNumber(searchText).isInteger() && searchText.length !== 12) {
        // block
        router.push(`/block-info/${searchText}`)
      } else if (searchText.length === 64) {
        // trx
        router.push(`/trx-info/${searchText}`)
      } else {
        // account
        router.push(`/resources/${searchText}`)
      }
    }
  }
  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="hidden items-center space-x-2 md:flex">
        <Image src={logo} width={40} alt={""}/>
        <span className="hidden font-bold sm:inline-block">
          {siteConfig.name}
        </span>
      </Link>
      {items?.length ? (
        <nav className="hidden gap-6 md:flex">
          {items?.map(
            (item, index) =>
              item.href && (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center text-lg font-semibold text-muted-foreground sm:text-sm",
                    item.disabled && "cursor-not-allowed opacity-80",
                    activeItem === item?.title?.toLocaleLowerCase() && "text-2xl font-bold text-primary"
                  )}
                  onClick={() => {
                    setActiveItem(item.title)
                  }}
                >
                  {item.title}
                </Link>
              )
          )}
        </nav>
      ) : null}
      <Input
        value={searchText}
        type="search"
        placeholder="Input Account / Trx / Block"
        className="h-9 xs:w-[200px] md:w-[300px] lg:w-[300px]"
        // className={`h-9 md:w-[100px] lg:w-[300px] ${searchTextFocus && 'border-0'}`}
        // onFocus={() => setSearchTextFocus(true)}
        // onBlur={() => setSearchTextFocus(false)}
        onKeyDown={handleEnterPress}
        onChange={(e) => { setSearchText(e?.target?.value?.trim()) }}
      />
    </div>
  )
}
