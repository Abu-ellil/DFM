import { CloudAccount } from '../../CloudAccount'
import { SyncSettings } from '../../SyncSettings'

export function CloudSettings() {
  return (
    <div className="space-y-6">
      <CloudAccount />
      <SyncSettings />
    </div>
  )
}
