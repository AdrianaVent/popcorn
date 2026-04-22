---
name: new-page
description: Scaffolds a new Next.js page in src/app/ with ssr:false dynamic import and mounted guard.
allowed-tools: Bash Read Write
---

Create a new page at `src/app/$ARGUMENTS/page.tsx`.

## Template

If the page loads a feature component (most cases), use the `dynamic + ssr:false` pattern:

```tsx
'use client'

import dynamic from 'next/dynamic'
import <Layout> from '@/components/layouts/<Layout>'
import <Skeleton> from '@/components/ui/<Skeleton>'

const <Feature> = dynamic(() => import('@/features/<path>'), {
  ssr: false,
  loading: () => <<Skeleton> />,
})

export default function <PageName>Page() {
  return (
    <<Layout>>
      <<Feature> />
    </<Layout>>
  )
}
```

If the page uses translated content directly (no feature component), use the `mounted` guard instead:

```tsx
'use client'

import { useState, useEffect } from 'react'

export default function <PageName>Page() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    // page content
  )
}
```

## Rules
- Always `'use client'` — pages in this project are client-rendered
- Prefer `dynamic + ssr:false` over the `mounted` guard when a feature component exists
- Create a skeleton component in `src/components/ui/` if one doesn't exist yet
- Add the route to the middleware `AUTH_ROUTES` array if it's a public (unauthenticated) route

After creating the file, note any skeleton or layout components that still need to be created.
