import { Card } from '../ui/Card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface SupplierChartProps {
  data: Array<{ name: string; value: number }>
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function SupplierChart({ data }: SupplierChartProps) {
  return (
    <Card>
      <h3 className="text-xl font-black mb-6 text-slate-800 dark:text-white">توزيع التوريدات حسب المورد</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(15 23 42)',
              border: '1px solid rgb(51 65 85)',
              borderRadius: '8px'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
