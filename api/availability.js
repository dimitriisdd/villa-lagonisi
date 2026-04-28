// api/availability.js
// Vercel serverless function — runs on the server, never exposes the iCal URL

export default async function handler(req, res) {
  // Allow your website to call this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const icalUrl = process.env.ICAL_URL;

  if (!icalUrl) {
    return res.status(500).json({ error: 'ICAL_URL environment variable not set.' });
  }

  let text;
  try {
    const response = await fetch(icalUrl, {
      headers: { 'User-Agent': 'Villa-Lagonisi-Calendar/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Booking.com returned HTTP ${response.status}`);
    }

    text = await response.text();
  } catch (err) {
    return res.status(502).json({ error: 'Failed to fetch calendar: ' + err.message });
  }

  // Parse iCal into booked date ranges
  const ranges = parseICal(text);

  // Cache for 1 hour on Vercel's edge — fresh enough, avoids hammering Booking.com
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');
  res.setHeader('Content-Type', 'application/json');

  return res.status(200).json({
    updated: new Date().toISOString(),
    count: ranges.length,
    ranges,
  });
}

function parseICal(text) {
  const ranges = [];
  // Unfold long lines (RFC 5545)
  const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r\n|\n|\r/);

  let inEvent = false;
  let dtStart = null;
  let dtEnd = null;
  let summary = '';

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      dtStart = null;
      dtEnd = null;
      summary = '';
    } else if (line === 'END:VEVENT') {
      if (inEvent && dtStart && dtEnd) {
        ranges.push({ start: dtStart, end: dtEnd, summary });
      }
      inEvent = false;
    } else if (inEvent) {
      // DTSTART and DTEND can have params: DTSTART;VALUE=DATE:20240101
      if (/^DTSTART/i.test(line)) {
        dtStart = extractDate(line);
      } else if (/^DTEND/i.test(line)) {
        dtEnd = extractDate(line);
      } else if (/^SUMMARY/i.test(line)) {
        summary = line.split(':').slice(1).join(':').trim();
      }
    }
  }

  return ranges;
}

function extractDate(line) {
  // Value is after the last colon
  const raw = line.split(':').slice(1).join(':').replace(/[TZ]/g, '').slice(0, 8);
  // Return as YYYY-MM-DD string (safe to send as JSON)
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}
