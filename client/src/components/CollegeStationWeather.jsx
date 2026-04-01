import { useEffect, useState } from "react";
import "../styles/CollegeStationWeather.css";

/** College Station, TX — used by Open-Meteo (no API key). */
const COLLEGE_STATION = { lat: 30.628, lon: -96.3344 };

const OPEN_METEO_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${COLLEGE_STATION.lat}&longitude=${COLLEGE_STATION.lon}` +
  "&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FChicago";

/**
 * Map WMO weather codes (Open-Meteo) to a compact visual variant for icons.
 * @see https://open-meteo.com/en/docs
 */
function weatherVariantFromCode(code) {
  const c = Number(code);
  if (Number.isNaN(c)) return "cloudy";
  if (c === 0) return "sunny";
  if (c === 1 || c === 2) return "partly-cloudy";
  if (c === 3) return "cloudy";
  if (c === 45 || c === 48) return "fog";
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return "rain";
  if (c >= 71 && c <= 77) return "snow";
  if (c >= 95 && c <= 99) return "storm";
  return "cloudy";
}

function shortDescription(code) {
  const v = weatherVariantFromCode(code);
  const labels = {
    sunny: "Clear",
    "partly-cloudy": "Partly cloudy",
    cloudy: "Cloudy",
    fog: "Fog",
    rain: "Rain",
    snow: "Snow",
    storm: "Storm",
  };
  return labels[v] || "Weather";
}

function WeatherGraphic({ variant }) {
  const common = { className: "weather-graphic-svg", viewBox: "0 0 48 48", "aria-hidden": true };
  switch (variant) {
    case "sunny":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="24"
              y1="4"
              x2="24"
              y2="9"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${deg} 24 24)`}
            />
          ))}
        </svg>
      );
    case "partly-cloudy":
      return (
        <svg {...common}>
          <circle cx="30" cy="16" r="7" fill="#fde68a" stroke="#f59e0b" strokeWidth="1" />
          <path
            fill="#e5e7eb"
            stroke="#9ca3af"
            strokeWidth="1.2"
            d="M14 32c-4.4 0-8-3.1-8-7 0-3.4 2.4-6.2 5.6-6.9.4-4 4-7.1 8.4-7.1 3.6 0 6.7 2.1 8 5.2.6-.1 1.2-.2 1.8-.2 4.7 0 8.5 3.4 8.5 7.6 0 4.2-3.8 7.6-8.5 7.6H14z"
          />
        </svg>
      );
    case "rain":
      return (
        <svg {...common}>
          <path
            fill="#d1d5db"
            stroke="#9ca3af"
            strokeWidth="1.2"
            d="M8 22c0-6 5-11 11-11 2.8 0 5.4 1 7.3 2.7C28.5 10 34.5 6 41 6c7.2 0 13 5.4 13 12 0 6.2-4.7 11.2-10.7 11.9H8V22z"
          />
          <line x1="14" y1="34" x2="12" y2="40" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="34" x2="22" y2="40" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="34" x2="32" y2="40" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "snow":
      return (
        <svg {...common}>
          <path
            fill="#e5e7eb"
            stroke="#9ca3af"
            strokeWidth="1.2"
            d="M8 22c0-6 5-11 11-11h12c6.6 0 12 5 12 11.2 0 6-5.4 10.8-12 10.8H8V22z"
          />
          <circle cx="16" cy="38" r="1.2" fill="#93c5fd" />
          <circle cx="24" cy="40" r="1.2" fill="#93c5fd" />
          <circle cx="32" cy="38" r="1.2" fill="#93c5fd" />
        </svg>
      );
    case "fog":
      return (
        <svg {...common}>
          <rect x="8" y="18" width="32" height="8" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1" />
          <path stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" d="M10 32h28M12 38h24" />
        </svg>
      );
    case "storm":
      return (
        <svg {...common}>
          <path
            fill="#94a3b8"
            stroke="#64748b"
            strokeWidth="1"
            d="M8 22c0-6 5-11 11-11 3 0 5.8 1.2 7.8 3.2C29 9 34.5 6 40 6c6.6 0 12 5 12 11 0 5.8-4.2 10.5-9.8 11.2H8V22z"
          />
          <path fill="#fbbf24" d="M20 26 L18 34h5l-1 6 8-11h-6l2-3z" />
        </svg>
      );
    case "cloudy":
    default:
      return (
        <svg {...common}>
          <path
            fill="#e5e7eb"
            stroke="#9ca3af"
            strokeWidth="1.5"
            d="M10 30c-5.5 0-10-4-10-9 0-4.2 2.9-7.8 6.9-8.8C8.8 7.8 14.8 4 21.5 4c6.2 0 11.5 3.3 14 8.2 1-.2 2-.3 3-.3 6.9 0 12.5 5.2 12.5 11.6 0 6.4-5.6 11.5-12.5 11.5H10z"
          />
        </svg>
      );
  }
}

export default function CollegeStationWeather() {
  const [state, setState] = useState({ loading: true, error: null, tempF: null, code: null });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(OPEN_METEO_URL);
        if (!res.ok) throw new Error("Weather request failed");
        const data = await res.json();
        const cur = data.current;
        if (!cur || typeof cur.temperature_2m !== "number") {
          throw new Error("Invalid weather payload");
        }
        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            tempF: Math.round(cur.temperature_2m),
            code: cur.weather_code ?? 0,
          });
        }
      } catch {
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false, error: "Unavailable" }));
        }
      }
    };
    load();
    const id = setInterval(load, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const variant = weatherVariantFromCode(state.code);
  const desc = state.code != null ? shortDescription(state.code) : "—";

  return (
    <aside
      className="college-station-weather"
      title="Current weather in College Station, TX (Open-Meteo)"
      data-i18n-skip="1"
    >
      <div className="college-station-weather__graphic" data-i18n-skip="1">
        {state.loading ? (
          <span className="college-station-weather__spinner" data-i18n-skip="1" aria-hidden>
            ···
          </span>
        ) : state.error ? (
          <span className="college-station-weather__err" data-i18n-skip="1">
            ?
          </span>
        ) : (
          <WeatherGraphic variant={variant} />
        )}
      </div>
      <div className="college-station-weather__text" data-i18n-skip="1">
        <span className="college-station-weather__temp" data-i18n-skip="1">
          {state.loading ? "—" : state.error ? "—" : `${state.tempF}°F`}
        </span>
        <span className="college-station-weather__desc" data-i18n-skip="1">
          {state.loading ? "…" : state.error ? state.error : desc}
        </span>
        <span className="college-station-weather__loc" data-i18n-skip="1">
          College Station
        </span>
      </div>
    </aside>
  );
}
