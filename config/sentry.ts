type NumericString = `${number}` | undefined;

const fallbackTracesSampleRate = 1.0;
const fallbackReplaysSessionSampleRate = 0.1;
const fallbackReplaysOnErrorSampleRate = 1.0;

const parseRate = (value: NumericString, fallback: number) => {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * 공통적으로 사용하는 Sentry DSN을 반환한다.
 */
export const sentryDsn =
  process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

/**
 * 트레이싱 샘플링 비율을 환경 변수에 따라 결정한다.
 */
export const getTracesSampleRate = () =>
  parseRate(
    process.env.SENTRY_TRACES_SAMPLE_RATE as NumericString,
    fallbackTracesSampleRate
  );

/**
 * Replay 관련 샘플링 비율을 반환한다.
 */
export const getReplaySampleRates = () => ({
  session: parseRate(
    process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE as NumericString,
    fallbackReplaysSessionSampleRate
  ),
  onError: parseRate(
    process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE as NumericString,
    fallbackReplaysOnErrorSampleRate
  ),
});
