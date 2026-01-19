import { describe, expect, it } from "vitest";
import { parseEmail, findParser } from "../index";
import type { EmailContent } from "../types";
import { isForwardedEmail, parseForwardedEmail } from "../forwarded";

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

describe("Forwarded Email Detection", () => {
  it("detects Gmail forwarded email by subject", () => {
    const email: EmailContent = {
      from: "mentor@example.com",
      to: "ftc-5064@buildseason.org",
      subject: "Fwd: Your REV Robotics Order #123456",
    };
    expect(isForwardedEmail(email)).toBe(true);
  });

  it("detects Gmail forwarded email by content", () => {
    const email: EmailContent = {
      from: "mentor@example.com",
      to: "ftc-5064@buildseason.org",
      subject: "Order for you",
      text: `
Here's the order confirmation.

---------- Forwarded message ---------
From: REV Robotics <orders@revrobotics.com>
Date: Mon, Jan 15, 2024 at 10:00 AM
Subject: Your REV Robotics Order #123456
To: mentor@example.com

Order Confirmation
Order Number: 123456
Total: $156.99
      `,
    };
    expect(isForwardedEmail(email)).toBe(true);
  });

  it("detects Outlook forwarded email", () => {
    const email: EmailContent = {
      from: "mentor@example.com",
      to: "ftc-5064@buildseason.org",
      subject: "FW: Your goBILDA Order",
      text: `
-----Original Message-----
From: goBILDA <orders@gobilda.com>
Sent: Monday, January 15, 2024 10:00 AM
Subject: Your goBILDA Order #GB-54321

Order #GB-54321
Total: $89.99
      `,
    };
    expect(isForwardedEmail(email)).toBe(true);
  });

  it("detects Apple Mail forwarded email", () => {
    const email: EmailContent = {
      from: "mentor@example.com",
      to: "ftc-5064@buildseason.org",
      subject: "Fwd: AndyMark Order",
      text: `
Begin forwarded message:

From: AndyMark <orders@andymark.com>
Subject: AndyMark Order Confirmation #98765
Date: January 15, 2024 at 10:00 AM

Order Number: 98765
Grand Total: $245.00
      `,
    };
    expect(isForwardedEmail(email)).toBe(true);
  });

  it("does not detect regular email as forwarded", () => {
    const email: EmailContent = {
      from: "orders@revrobotics.com",
      to: "ftc-5064@buildseason.org",
      subject: "Your REV Robotics Order #123456",
      text: "Order confirmation for #123456",
    };
    expect(isForwardedEmail(email)).toBe(false);
  });
});

describe("Forwarded Email Parsing", () => {
  it("extracts original sender from Gmail forward", () => {
    const email: EmailContent = {
      from: "mentor@example.com",
      to: "ftc-5064@buildseason.org",
      subject: "Fwd: Your REV Robotics Order #123456",
      text: `
---------- Forwarded message ---------
From: REV Robotics <orders@revrobotics.com>
Date: Mon, Jan 15, 2024 at 10:00 AM
Subject: Your REV Robotics Order #123456
To: mentor@example.com

Order Confirmation
Order Number: 123456
Total: $156.99
      `,
    };
    const forwarded = parseForwardedEmail(email);
    expect(forwarded).not.toBeNull();
    expect(forwarded?.originalFrom).toBe("orders@revrobotics.com");
    expect(forwarded?.originalSubject).toBe("Your REV Robotics Order #123456");
  });

  it("extracts original sender from Outlook forward", () => {
    const email: EmailContent = {
      from: "mentor@example.com",
      to: "ftc-5064@buildseason.org",
      subject: "FW: Your goBILDA Order",
      text: `
-----Original Message-----
From: goBILDA Store <orders@gobilda.com>
Sent: Monday, January 15, 2024 10:00 AM
Subject: Your goBILDA Order #GB-54321

Order #GB-54321
Total: $89.99
      `,
    };
    const forwarded = parseForwardedEmail(email);
    expect(forwarded).not.toBeNull();
    expect(forwarded?.originalFrom).toBe("orders@gobilda.com");
  });
});

describe("Forwarded Email End-to-End Parsing", () => {
  it("parses forwarded REV order confirmation", async () => {
    const email: EmailContent = {
      from: "mentor@example.com",
      to: "ftc-5064@buildseason.org",
      subject: "Fwd: Your REV Robotics Order #123456",
      text: `
Here's the order I just placed.

---------- Forwarded message ---------
From: REV Robotics <orders@revrobotics.com>
Date: Mon, Jan 15, 2024 at 10:00 AM
Subject: Your REV Robotics Order #123456
To: mentor@example.com

Order Confirmation
Thank you for your order!
Order Number: 123456
Order Total: $156.99
      `,
    };
    const result = await parseEmail(email);
    expect(result.type).toBe("order_confirmation");
    expect(result.vendor).toBe("rev");
    expect(result.orderNumber).toBe("123456");
    expect(result.totalCents).toBe(15699);
  });

  it("parses forwarded goBILDA shipping notification", async () => {
    const email: EmailContent = {
      from: "coach@team5064.org",
      to: "ftc-5064@buildseason.org",
      subject: "FW: Your goBILDA order has shipped",
      text: `
Parts are on the way!

-----Original Message-----
From: goBILDA <shipping@gobilda.com>
Sent: Monday, January 15, 2024 2:00 PM
Subject: Your goBILDA order has shipped

Your order #GB-12345 has shipped!
Tracking Number: 1Z999AA10123456784
      `,
    };
    const result = await parseEmail(email);
    expect(result.type).toBe("shipping_notification");
    expect(result.vendor).toBe("gobilda");
    expect(result.orderNumber).toBe("GB-12345");
    expect(result.trackingNumbers).toHaveLength(1);
    expect(result.trackingNumbers?.[0].carrier).toBe("ups");
  });

  it("parses forwarded AndyMark order via HTML", async () => {
    const email: EmailContent = {
      from: "lead.mentor@school.edu",
      to: "ftc-5064@buildseason.org",
      subject: "Fwd: AndyMark Order Confirmation",
      html: `
<div>Here's the order confirmation</div>
<br>
<div>---------- Forwarded message ---------</div>
<div>From: <b>AndyMark</b> &lt;orders@andymark.com&gt;</div>
<div>Date: Mon, Jan 15, 2024 at 10:00 AM</div>
<div>Subject: AndyMark Order Confirmation #98765</div>
<br>
<div>Order Confirmation</div>
<div>Order Number: 98765</div>
<div>Grand Total: $245.00</div>
      `,
    };
    const result = await parseEmail(email);
    expect(result.type).toBe("order_confirmation");
    expect(result.vendor).toBe("andymark");
    expect(result.orderNumber).toBe("98765");
    expect(result.totalCents).toBe(24500);
  });
});
