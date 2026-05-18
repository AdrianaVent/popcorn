'use client'

import React from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import Tabs from '@/components/ui/Tabs'

type Tab<T extends string> = { value: T; labelKey: string }

type Props<T extends string> = {
  tabs: Tab<T>[]
  activeTab: T
  onTabChange: (value: T) => void
  children: React.ReactElement<{ className?: string }>
}

export default function HomeCard<T extends string>({ tabs, activeTab, onTabChange, children }: Props<T>) {
  const { t } = useTranslation()

  const translatedTabs = tabs.map((tab) => ({ value: tab.value, label: t(tab.labelKey) }))

  return (
    <div className="flex flex-col">
      <Tabs tabs={translatedTabs} activeTab={activeTab} onTabChange={onTabChange} fillBorder={false} />
      {React.cloneElement(children, {
        className: clsx(children.props.className, 'flex-1'),
      })}
    </div>
  )
}
