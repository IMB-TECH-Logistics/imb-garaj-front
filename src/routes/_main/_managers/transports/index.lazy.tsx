import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_main/_managers/transports/')({
  component: () => <div>Hello /_main/_managers/transports/!</div>,
})
