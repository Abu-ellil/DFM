import { Card } from '../ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface FinanceChartProps {
  data: Array<{ date: string; income: number; expenses: number }>
}

export default function FinanceChart({ data }: FinanceChartProps) {
  return (
    <Card>
      <h3 className="text-xl font-black mb-6 text-slate-800 dark:text-white">التدفق المالي</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
          <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="وارد" />
          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="صادر" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
