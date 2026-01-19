/**
 * Email Extraction Module
 *
 * Agent-first email parsing using Claude Haiku.
 */

export {
  parseEmailWithAgent,
  toParserResult,
  type EmailInput,
  type ParseEmailResult,
  type ParseResult,
  type ParseError,
} from "./parser";

export {
  ExtractedEmailSchema,
  LineItemSchema,
  TrackingInfoSchema,
  VendorInfoSchema,
  validateExtraction,
  type ExtractedEmail,
  type LineItem,
  type TrackingInfo,
  type VendorInfo,
} from "./schema";
