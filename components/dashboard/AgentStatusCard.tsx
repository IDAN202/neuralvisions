import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface AgentStatusCardProps {
  label: string
  icon: LucideIcon
  count: number
  href: string
  color: string
}

export function AgentStatusCard({ label, icon: Icon, count, href, color }: AgentStatusCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between">
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-2xl font-bold">{count}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{label}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
