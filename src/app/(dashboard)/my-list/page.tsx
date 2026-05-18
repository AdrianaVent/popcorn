'use client'

import dynamic from 'next/dynamic'
import Loading from './loading'

const MyList = dynamic(() => import('@/features/myList/MyListFeature'), {
  ssr: false,
  loading: Loading,
})

export default function MyListPage() {
  return <MyList />
}
