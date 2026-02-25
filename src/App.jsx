import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Leaf, Wind, Activity, MapPin, AlertCircle, CheckCircle2, AlertTriangle, Search, History, Sun, Moon, Loader2 } from 'lucide-react';

function App() {
  const [pollutionData, setPollutionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cityInput, setCityInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [cityName, setCityName] = useState('Sua Localização');
  const [lastSearch, setLastSearch] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  
  const searchTimeout = useRef(null);

  const API_KEY = 'ad5418c918483d05954b5b6234fe22fe';

  useEffect(() => {
    const savedTheme = localStorage.getItem('ecoTheme');
    if (savedTheme === 'dark') setDarkMode(true);
    const savedSearch = localStorage.getItem('lastEcoSearch');
    if (savedSearch) setLastSearch(JSON.parse(savedSearch));
    getUserLocation();
  }, []);

  useEffect(() => {
    localStorage.setItem('ecoTheme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Busca de Sugestões (Autosuggest)
  useEffect(() => {
    if (cityInput.length > 2) {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(async () => {
        try {
          const res = await axios.get(
            `https://api.openweathermap.org/geo/1.0/direct?q=${cityInput}&limit=5&appid=${API_KEY}`
          );
          setSuggestions(res.data);
        } catch (err) {
          console.error("Erro ao buscar cidades");
        }
      }, 500);
    } else {
      setSuggestions([]);
    }
  }, [cityInput]);

  const getUserLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchPollutionData(pos.coords.latitude, pos.coords.longitude, "Sua Região"),
      () => {
        setError("Localização negada. Pesquise uma cidade acima.");
        setLoading(false);
      }
    );
  };

  const fetchPollutionData = async (lat, lon, name) => {
    setLoading(true);
    setSuggestions([]);
    setCityInput('');
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      const data = response.data.list[0];
      setPollutionData(data);
      setCityName(name);
      
      const searchInfo = { name, aqi: data.main.aqi, time: new Date().toLocaleTimeString() };
      setLastSearch(searchInfo);
      localStorage.setItem('lastEcoSearch', JSON.stringify(searchInfo));
      setLoading(false);
    } catch (err) {
      setError("Erro ao carregar dados.");
      setLoading(false);
    }
  };

  const getStatusDetails = (aqi) => {
    const status = {
      1: { label: 'Excelente', color: 'text-emerald-500', bg: darkMode ? 'bg-emerald-950/30' : 'bg-emerald-50', tip: "Ar puro! Ótimo para esportes ao ar livre." },
      2: { label: 'Bom', color: 'text-green-500', bg: darkMode ? 'bg-green-950/30' : 'bg-green-50', tip: "Qualidade aceitável. Pode ventilar a casa." },
      3: { label: 'Moderado', color: 'text-yellow-500', bg: darkMode ? 'bg-yellow-950/30' : 'bg-yellow-50', tip: "Pessoas sensíveis devem reduzir esforço pesado." },
      4: { label: 'Ruim', color: 'text-orange-500', bg: darkMode ? 'bg-orange-950/30' : 'bg-orange-50', tip: "Evite atividades prolongadas no exterior." },
      5: { label: 'Crítico', color: 'text-red-500', bg: darkMode ? 'bg-red-950/30' : 'bg-red-50', tip: "Perigo! Mantenha janelas fechadas e use máscara." }
    };
    return status[aqi] || status[1];
  };

  const chartData = pollutionData ? [
    { name: 'CO/100', valor: pollutionData.components.co / 100 },
    { name: 'NO2', valor: pollutionData.components.no2 },
    { name: 'O3', valor: pollutionData.components.o3 },
    { name: 'PM10', valor: pollutionData.components.pm10 },
  ] : [];

  return (
    <div className={`${darkMode ? 'bg-slate-950 text-white' : 'bg-[#F8FAFC] text-slate-900'} min-h-screen transition-colors duration-500 font-sans pb-10`}>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group cursor-default">
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-2 rounded-xl shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                <Leaf className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">
                {/* ECO com cor sólida no modo claro e degradê no escuro */}
                <span className={`${darkMode ? 'bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400' : 'text-slate-900'}`}>
                  ECO
                </span>
                <span className="text-green-600">TRACK</span>
              </h1>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition-all ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white text-slate-400 shadow-sm border border-slate-200 hover:bg-slate-50'}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Busca Mágica */}
          <div className="relative w-full md:w-96">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${cityInput.length > 0 ? 'text-green-500' : 'text-slate-400'}`} size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar cidade..." 
                className={`w-full py-3 pl-12 pr-4 rounded-2xl outline-none border-2 transition-all font-semibold ${darkMode ? 'bg-slate-900 border-slate-800 focus:border-green-500' : 'bg-white border-slate-100 focus:border-green-400'}`}
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
              />
            </div>

            {/* Lista de Sugestões Detalhada */}
            {suggestions.length > 0 && (
              <ul className={`absolute z-50 w-full mt-2 rounded-2xl shadow-2xl border overflow-hidden animate-in fade-in slide-in-from-top-2 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-700'}`}>
                {suggestions.map((city, i) => (
                  <li 
                    key={i} 
                    onClick={() => fetchPollutionData(city.lat, city.lon, `${city.name}, ${city.country}`)} 
                    className={`px-5 py-4 cursor-pointer flex flex-col hover:bg-green-600 hover:text-white transition-colors border-b last:border-none ${darkMode ? 'border-slate-800' : 'border-slate-50'}`}
                  >
                    <span className="font-bold text-sm">{city.name}</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-60 font-black">
                      {city.state ? `${city.state}, ` : ''}{city.country}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        {/* Localização e Histórico */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'} font-bold text-xs`}>
            <MapPin size={14} className="text-green-500 animate-pulse" /> {cityName}
          </div>
          {lastSearch && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>
              <History size={12} className="text-green-400" /> {lastSearch.name} • AQI {lastSearch.aqi}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-2 font-bold text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="h-80 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-green-400 opacity-20"></div>
              <Leaf className="text-green-500 animate-bounce" size={48} />
            </div>
            <p className="mt-6 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Analisando Atmosfera</p>
          </div>
        ) : pollutionData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* Card Principal AQI */}
            <div className={`p-10 rounded-[3rem] shadow-2xl border-4 ${darkMode ? 'border-slate-900' : 'border-white'} ${getStatusDetails(pollutionData.main.aqi).bg}`}>
              <div className="flex items-center gap-2 mb-8 opacity-40 italic">
                <Wind size={16}/> <span className="text-[10px] font-black uppercase tracking-widest">Air Quality Index</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-8xl md:text-[10rem] leading-none font-black tracking-tighter ${getStatusDetails(pollutionData.main.aqi).color}`}>
                  {pollutionData.main.aqi}
                </span>
                <span className="text-2xl font-black text-slate-400 uppercase italic">Aqi</span>
            </div>
              <h3 className={`text-3xl font-black uppercase tracking-tight ${getStatusDetails(pollutionData.main.aqi).color}`}>
                {getStatusDetails(pollutionData.main.aqi).label}
              </h3>
              <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5">
                <p className={`text-sm font-bold leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                   <span className="block text-[10px] uppercase opacity-50 mb-1">Dica de Saúde</span>
                   {getStatusDetails(pollutionData.main.aqi).tip}
                </p>
              </div>
            </div>

            {/* Gráfico */}
            <div className={`lg:col-span-2 p-10 rounded-[3rem] shadow-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white shadow-slate-200/50'}`}>
              <div className="flex items-center justify-between mb-12">
                <h2 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2 italic">
                  <Activity size={16} className="text-red-500"/> Composição Química
                </h2>
                <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 uppercase italic">Unidade: $\mu g/m^3$</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} dy={15} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ stroke: '#10b981', strokeWidth: 2 }}
                      contentStyle={{ backgroundColor: darkMode ? '#020617' : '#fff', borderRadius: '25px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }} 
                    />
                    <Line type="stepBefore" dataKey="valor" stroke="#10b981" strokeWidth={6} dot={{r: 6, fill: '#fff', strokeWidth: 4, stroke: '#10b981'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="max-w-6xl mx-auto px-8 mt-10 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400/50 text-center md:text-left italic">
        Real-Time Environmental Intelligence Engine
      </footer>
    </div>
  );
}

export default App;