import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const trafficHoursData = [
  { hour: "06:00", value: 30 },
  { hour: "09:00", value: 85 },
  { hour: "12:00", value: 50 },
  { hour: "15:00", value: 45 },
  { hour: "18:00", value: 95 },
];

const accidentsData = [
  { name: "București", value: 46, color: "hsl(217, 91%, 60%)" },
  { name: "Cluj", value: 17, color: "hsl(217, 91%, 70%)" },
  { name: "Timiș", value: 14, color: "hsl(217, 91%, 75%)" },
  { name: "Constanța", value: 13, color: "hsl(217, 91%, 80%)" },
  { name: "Iași", value: 10, color: "hsl(217, 91%, 85%)" },
];

const speedData = [
  { name: "E85", limit: 90, average: 72 },
  { name: "A1", limit: 130, average: 115 },
  { name: "A2", limit: 130, average: 120 },
  { name: "DN1", limit: 100, average: 68 },
  { name: "A3", limit: 130, average: 110 },
  { name: "E81", limit: 90, average: 65 },
];

export const TrafficStats = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">Statistici Trafic România</h2>
        <p className="text-muted-foreground mb-8">Statistici bazate pe date istorice estimate</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Peak Traffic Hours */}
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4">Ore de Vârf Trafic</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficHoursData}>
                  <XAxis 
                    dataKey="hour" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(217, 91%, 60%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accidents by County */}
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4">Accidente pe Județe (2024)</h3>
            <div className="flex items-center gap-4">
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accidentsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {accidentsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {accidentsData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Speed Comparison */}
          <div className="stat-card">
            <h3 className="font-semibold text-foreground mb-4">Viteză Medie vs. Limită</h3>
            <div className="flex items-center gap-4 mb-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-muted-foreground">Limită Legală</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary/50" />
                <span className="text-muted-foreground">Viteză Medie</span>
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speedData} layout="vertical">
                  <XAxis 
                    type="number" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    width={35}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="limit" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="average" fill="hsl(217, 91%, 75%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
