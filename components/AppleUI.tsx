// Apple iOS-style UI components

interface AppleToggleProps {
  isSelected: boolean;
  onChange: () => void;
  children: React.ReactNode;
  description?: string;
}

export function AppleToggle({ isSelected, onChange, children, description }: AppleToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`
        w-full p-4 rounded-2xl border transition-all duration-300 ease-out
        ${isSelected
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
          : 'border-gray-300 bg-white/5 hover:border-blue-400 hover:bg-blue-500/5'
        }
        active:scale-98 transform
      `}
    >
      <div className="flex items-center justify-between">
        <div className="text-left flex-1">
          <div className={`font-semibold text-lg ${isSelected ? 'text-blue-600' : 'text-white'}`}>
            {children}
          </div>
          {description && (
            <div className="text-sm text-gray-400 mt-1">
              {description}
            </div>
          )}
        </div>
        <div className={`
          w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200
          ${isSelected
            ? 'bg-blue-500 border-blue-500 scale-110'
            : 'border-gray-400 bg-transparent'
          }
        `}>
          {isSelected && (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

interface AppleCardProps {
  isSelected: boolean;
  onChange: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  gradient?: string;
}

export function AppleCard({ isSelected, onChange, title, subtitle, icon, gradient }: AppleCardProps) {
  const gradientClass = gradient || 'from-blue-500 to-purple-600';

  return (
    <button
      onClick={onChange}
      className={`
        relative w-full p-6 rounded-3xl transition-all duration-300 ease-out
        ${isSelected
          ? `bg-gradient-to-br ${gradientClass} shadow-2xl shadow-blue-500/30 scale-105`
          : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600'
        }
        active:scale-95 transform overflow-hidden
      `}
    >
      {/* Background pattern for selected state */}
      {isSelected && (
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
      )}

      <div className="relative z-10 text-center">
        {icon && (
          <div className="text-4xl mb-3">{icon}</div>
        )}
        <div className={`font-bold text-lg mb-2 ${isSelected ? 'text-white' : 'text-white'}`}>
          {title}
        </div>
        {subtitle && (
          <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      )}
    </button>
  );
}

interface AppleProgressProps {
  progress: number; // 0 to 1
  message?: string;
}

export function AppleProgress({ progress, message }: AppleProgressProps) {
  // Generate engaging sub-text based on progress
  const getEngagingText = () => {
    if (progress < 0.2) return "🤖 AI is analyzing your preferences..."
    if (progress < 0.4) return "📝 Crafting your unique meditation script..."
    if (progress < 0.6) return "🎨 Designing the perfect experience..."
    if (progress < 0.8) return "🧘‍♀️ Fine-tuning for your journey..."
    return "✨ Almost ready for your transformation..."
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Breathing animation circle */}
      <div className="w-32 h-32 mx-auto mb-8 relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-40 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Progress message */}
      {message && (
        <p className="text-center text-white text-lg font-medium mb-2">
          {message}
        </p>
      )}

      {/* Engaging sub-text to keep user focused */}
      <p className="text-center text-gray-400 text-sm mb-6 leading-relaxed">
        {getEngagingText()}
      </p>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 rounded-full h-3 mb-4 overflow-hidden">
        <div
          className="h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Percentage */}
      <p className="text-center text-gray-400 text-sm">
        {Math.round(progress * 100)}%
      </p>
    </div>
  );
}

interface ApplePillButtonProps {
  isSelected: boolean;
  onChange: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function ApplePillButton({ isSelected, onChange, children, size = 'md' }: ApplePillButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      onClick={onChange}
      className={`
        ${sizeClasses[size]} rounded-full font-semibold transition-all duration-200 ease-out
        ${isSelected
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
        }
        active:scale-95 transform
      `}
    >
      {children}
    </button>
  );
}