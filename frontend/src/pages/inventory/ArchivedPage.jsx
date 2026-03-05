import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '../../api/inventoryApi'
import { Archive } from 'lucide-react'

export default function ArchivedPage() {
  const { data: res, isLoading } = useQuery({
    queryKey: ['inventory-archived'],
    queryFn: () => inventoryApi.getArchived(),
  })

  const items = Array.isArray(res) ? res : res?.data || []

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground">Archived Items</h2>

      <div className="pm-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Archive size={32} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No archived items</p>
          </div>
        ) : (
          <table className="pm-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Batch</th>
                <th>Archived Reason</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="font-medium text-foreground">{item.drugName}</td>
                  <td><span className="badge-gray text-xs">{item.category || '—'}</span></td>
                  <td className="font-mono text-xs text-muted-foreground">{item.batchNumber || '—'}</td>
                  <td className="text-muted-foreground text-sm">{item.archivedReason || 'Archived'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
