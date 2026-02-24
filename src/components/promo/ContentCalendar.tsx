'use client';

export default function ContentCalendar() {
  return (
    <section>
      <h2
        className="font-[family-name:var(--font-playfair)] text-lg mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        Content Calendar Hints
      </h2>

      <div className="space-y-6">
        <div
          className="rounded-xl p-5"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <h3
            className="font-[family-name:var(--font-inter)] text-sm font-medium mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Best times to post
          </h3>
          <div className="space-y-2">
            {[
              { platform: 'Instagram', times: '9\u201311am, 7\u20139pm (your timezone)' },
              { platform: 'TikTok', times: '7\u20139am, 12\u20133pm, 7\u201311pm' },
              { platform: 'Twitter/X', times: '8\u201310am, 12\u20131pm' },
            ].map((item) => (
              <div key={item.platform} className="flex gap-3">
                <span
                  className="font-[family-name:var(--font-jetbrains)] text-xs w-20 shrink-0"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {item.platform}
                </span>
                <span
                  className="font-[family-name:var(--font-inter)] text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.times}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <h3
            className="font-[family-name:var(--font-inter)] text-sm font-medium mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Weekly content rhythm
          </h3>
          <div className="space-y-2">
            {[
              { day: 'Monday', idea: 'Focus preset + "start your week" angle' },
              { day: 'Tuesday', idea: 'Brainwave education (Card 2)' },
              { day: 'Wednesday', idea: 'Midweek meditation reset' },
              { day: 'Thursday', idea: 'Pro feature highlight (Card 4 or 6)' },
              { day: 'Friday', idea: 'Relaxation / wind-down preset' },
              { day: 'Saturday', idea: 'Therapy / practitioner angle' },
              { day: 'Sunday', idea: 'Sleep preset + "recharge" angle' },
            ].map((item) => (
              <div key={item.day} className="flex gap-3">
                <span
                  className="font-[family-name:var(--font-jetbrains)] text-xs w-20 shrink-0"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {item.day}
                </span>
                <span
                  className="font-[family-name:var(--font-inter)] text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.idea}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
