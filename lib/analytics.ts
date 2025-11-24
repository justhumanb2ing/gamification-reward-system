export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export const hasGaMeasurementId = GA_MEASUREMENT_ID.length > 0;
