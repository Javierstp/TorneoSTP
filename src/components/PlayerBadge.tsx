import type { Player } from '../types'
import { getCountry } from '../lib/countries'

interface Props {
  player: Player | null | undefined
  reverse?: boolean
  compact?: boolean
}

function FlagImage({ alpha2, name }: { alpha2: string; name?: string }) {
  return (
    <img
      src={`https://flagcdn.com/w20/${alpha2}.png`}
      srcSet={`https://flagcdn.com/w20/${alpha2}.png 1x, https://flagcdn.com/w40/${alpha2}.png 2x`}
      alt={name || alpha2}
      className="w-5 h-auto rounded-sm shrink-0"
      loading="lazy"
    />
  )
}

export function PlayerBadge({ player, reverse, compact }: Props) {
  if (!player) {
    return (
      <div
        className={`flex items-center gap-2 text-gray-600 ${
          reverse ? 'flex-row-reverse' : ''
        }`}
      >
        <span className="w-5 h-3 rounded-sm bg-gray-700/50 shrink-0" />
        <span className={compact ? 'text-xs' : 'text-sm'}>—</span>
      </div>
    )
  }

  const country = getCountry(player.country_code)

  return (
    <div
      className={`flex items-center gap-2 ${reverse ? 'flex-row-reverse' : ''}`}
    >
      {country ? (
        <FlagImage alpha2={country.alpha2} name={country.name} />
      ) : (
        <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-bold shrink-0">
          ?
        </span>
      )}
      <div className={`${reverse ? 'text-right' : ''}`}>
        <div className={`font-semibold text-gray-200 ${compact ? 'text-xs' : 'text-sm'}`}>
          {player.country_code}
        </div>
        {!compact && (
          <div className="text-xs text-gray-400">{player.name}</div>
        )}
      </div>
    </div>
  )
}
