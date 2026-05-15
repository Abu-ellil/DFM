import { Card } from '../ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface WeightChartProps {
  data: Array<{ date: string; weight: number }>
}

export default function WeightChart({ data }: WeightChartProps) {
  return (
    <Card>
      <h3 className="text-xl font-black mb-6 text-slate-800 dark:text-white">حجم التوريدات (كجم)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" />
          <YAxis className="text-slate-600 dark:text-slate-400" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(15 23 42)',
              border: '1px solid rgb(51 65 85)',
              borderRadius: '8px'
            }}
            labelStyle={{ color: 'rgb(226 232 240)' }}
          />
          <Bar dataKey="weight" fill="#10b981" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
