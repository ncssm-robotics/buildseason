import { describe, expect, it } from "vitest";
import { parseEmail, findParser } from "../index";
import type { EmailContent } from "../types";

describe("Email Parser Registry", () => {
  describe("findParser", () => {
    it("finds REV parser for revrobotics.com emails", () => {
      const email: EmailContent = {
        from: "orders@revrobotics.com",
        to: "ftc-5064@buildseason.org",
        subject: "Order Confirmation",
      };
      const parser = findParser(email);
      expect(parser?.vendorId).toBe("rev");
    });

    it("finds goBILDA parser for gobilda.com emails", () => {
      const email: EmailContent = {
        from: "noreply@gobilda.com",
        to: "ftc-5064@buildseason.org",
        subject: "Order Confirmation",
      };
      const parser = findParser(email);
      expect(parser?.vendorId).toBe("gobilda");
    });

    it("finds AndyMark parser for andymark.com emails", () => {
      const email: EmailContent = {
        from: "orders@andymark.com",
        to: "ftc-5064@buildseason.org",
        subject: "Order Confirmation",
      };
      const parser = findParser(email);
      expect(parser?.vendorId).toBe("andymark");
    });

    it("finds carrier parser for UPS emails", () => {
      const email: EmailContent = {
        from: "pkginfo@ups.com",
        to: "ftc-5064@buildseason.org",
        subject: "Your Package is On Its Way",
      };
      const parser = findParser(email);
      expect(parser?.vendorId).toBe("carrier");
    });

    it("returns null for unknown senders", () => {
      const email: EmailContent = {
        from: "random@example.com",
        to: "ftc-5064@buildseason.org",
        subject: "Hello",
      };
      const parser = findParser(email);
      expect(parser).toBeNull();
    });
  });

  describe("parseEmail", () => {
    it("returns unknown for unrecognized emails", async () => {
      const email: EmailContent = {
        from: "random@example.com",
        to: "ftc-5064@buildseason.org",
        subject: "Hello",
      };
      const result = await parseEmail(email);
      expect(result.type).toBe("unknown");
      expect(result.vendor).toBe("unknown");
      expect(result.confidence).toBe(0);
    });
  });
});

describe("REV Robotics Parser", () => {
  it("parses order confirmation email", async () => {
    const email: EmailContent = {
      from: "orders@revrobotics.com",
      to: "ftc-5064@buildseason.org",
      subject: "Your REV Robotics Order #123456",
      html: `
        <h1>Order Confirmation</h1>
        <p>Thank you for your order!</p>
        <p>Order Number: 123456</p>
        <p>Order Total: $156.99</p>
      `,
    };
    const result = await parseEmail(email);
    expect(result.type).toBe("order_confirmation");
    expect(result.vendor).toBe("rev");
    expect(result.orderNumber).toBe("123456");
    expect(result.totalCents).toBe(15699);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("parses shipping notification with UPS tracking", async () => {
    const email: EmailContent = {
      from: "shipping@revrobotics.com",
      to: "ftc-5064@buildseason.org",
      subject: "Your REV Robotics order has shipped",
      html: `
        <h1>Shipping Notification</h1>
        <p>Your order #789012 has shipped!</p>
        <p>Tracking Number: 1Z999AA10123456784</p>
      `,
    };
    const result = await parseEmail(email);
    expect(result.type).toBe("shipping_notification");
    expect(result.vendor).toBe("rev");
    expect(result.orderNumber).toBe("789012");
    expect(result.trackingNumbers).toHaveLength(1);
    expect(result.trackingNumbers?.[0].carrier).toBe("ups");
    expect(result.trackingNumbers?.[0].trackingNumber).toBe(
      "1Z999AA10123456784"
    );
  });
});

describe("goBILDA Parser", () => {
  it("parses order confirmation with GB- prefix", async () => {
    const email: EmailContent = {
      from: "orders@gobilda.com",
      to: "ftc-5064@buildseason.org",
      subject: "Your goBILDA Order #GB-54321",
      html: `
        <h1>Order Confirmation</h1>
        <p>Thank you for your order!</p>
        <p>Order #GB-54321</p>
        <p>Total: $89.99</p>
      `,
    };
    const result = await parseEmail(email);
    expect(result.type).toBe("order_confirmation");
    expect(result.vendor).toBe("gobilda");
    expect(result.orderNumber).toBe("GB-54321");
    expect(result.totalCents).toBe(8999);
  });
});

describe("AndyMark Parser", () => {
  it("parses order confirmation email", async () => {
    const email: EmailContent = {
      from: "noreply@andymark.com",
      to: "ftc-5064@buildseason.org",
      subject: "AndyMark Order Confirmation #98765",
      html: `
        <h1>Order Confirmation</h1>
        <p>Order Number: 98765</p>
        <p>Grand Total: $245.00</p>
      `,
    };
    const result = await parseEmail(email);
    expect(result.type).toBe("order_confirmation");
    expect(result.vendor).toBe("andymark");
    expect(result.orderNumber).toBe("98765");
    expect(result.totalCents).toBe(24500);
  });
});

describe("Carrier Parser", () => {
  it("parses UPS shipping notification", async () => {
    const email: EmailContent = {
      from: "pkginfo@ups.com",
      to: "ftc-5064@buildseason.org",
      subject: "UPS: Your Package is On Its Way",
      html: `
        <h1>Shipping Update</h1>
        <p>Your package is on its way!</p>
        <p>Tracking Number: 1Z999AA10123456784</p>
        <p>Scheduled Delivery: Monday, 01/20/2025</p>
      `,
    };
    const result = await parseEmail(email);
    expect(result.type).toBe("shipping_notification");
    expect(result.vendor).toBe("ups");
    expect(result.trackingNumbers).toHaveLength(1);
    expect(result.trackingNumbers?.[0].carrier).toBe("ups");
    expect(result.estimatedDelivery).toBe("Monday, 01/20/2025");
  });

  it("parses FedEx shipping notification", async () => {
    const email: EmailContent = {
      from: "TrackingUpdates@fedex.com",
      to: "ftc-5064@buildseason.org",
      subject: "FedEx Shipment Update",
      html: `
        <p>Your FedEx shipment is on its way.</p>
        <p>Tracking: 123456789012</p>
      `,
    };
    const result = await parseEmail(email);
    expect(result.type).toBe("shipping_notification");
    expect(result.vendor).toBe("fedex");
    expect(result.trackingNumbers).toHaveLength(1);
    expect(result.trackingNumbers?.[0].carrier).toBe("fedex");
  });

  it("parses USPS shipping notification", async () => {
    const email: EmailContent = {
      from: "USPSInformeddelivery@usps.gov",
      to: "ftc-5064@buildseason.org",
      subject: "USPS Tracking Update",
      html: `
        <p>Your package is on its way.</p>
        <p>Tracking: 9400111899223456789012</p>
      `,
    };
    const result = await parseEmail(email);
    expect(result.type).toBe("shipping_notification");
    expect(result.vendor).toBe("usps");
    expect(result.trackingNumbers).toHaveLength(1);
    expect(result.trackingNumbers?.[0].carrier).toBe("usps");
  });
});
