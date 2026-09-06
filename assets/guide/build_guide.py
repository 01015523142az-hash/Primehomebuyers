# Builds the "2026 As-Is Home Seller's Blueprint" PDF that the exit-intent
# popup on primehomebuyers.casa offers.
#
# The popup promised this document and nothing existed. The three sections
# below are exactly the three bullets the popup advertises, in the same order,
# so what arrives is what was offered.
#
# The eviction section deliberately gives general information and points at an
# attorney. PrimeHome Buyers is not a law firm and the site says so; a guide
# that reads like legal advice would contradict its own terms page.

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    NextPageTemplate, PageBreak, Table, TableStyle, KeepTogether,
)

OUT = "phb/assets/guide/2026-as-is-home-sellers-blueprint.pdf"

BRAND = colors.HexColor("#0f5a45")
BRAND_DK = colors.HexColor("#093d2e")
BRAND_LT = colors.HexColor("#e8f4ef")
GOLD = colors.HexColor("#c28422")
INK = colors.HexColor("#0e1c18")
INK_BODY = colors.HexColor("#2c3e39")
INK_SOFT = colors.HexColor("#4d625c")
LINE = colors.HexColor("#cbdcd4")

PHONE = "307-441-5766"
EMAIL = "support@primehomebuyers.casa"
SITE = "primehomebuyers.casa"
ADDRESS = "5830 E 2nd St, Casper, WY 82609"

S = {
    "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=30, leading=35,
                            textColor=colors.white, alignment=TA_LEFT, spaceAfter=10),
    "subtitle": ParagraphStyle("subtitle", fontName="Helvetica", fontSize=13, leading=18,
                               textColor=colors.HexColor("#cfe4db"), spaceAfter=4),
    "eyebrow": ParagraphStyle("eyebrow", fontName="Helvetica-Bold", fontSize=8.5, leading=12,
                              textColor=GOLD, spaceAfter=14),
    "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=19, leading=23,
                         textColor=BRAND_DK, spaceBefore=4, spaceAfter=4),
    "kicker": ParagraphStyle("kicker", fontName="Helvetica-Bold", fontSize=8.5, leading=11,
                             textColor=GOLD, spaceAfter=3),
    "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=11.5, leading=15,
                         textColor=BRAND, spaceBefore=11, spaceAfter=3),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=9.8, leading=14.6,
                           textColor=INK_BODY, spaceAfter=7),
    "lead": ParagraphStyle("lead", fontName="Helvetica", fontSize=11, leading=16.5,
                           textColor=INK_SOFT, spaceAfter=10),
    "instead": ParagraphStyle("instead", fontName="Helvetica-Oblique", fontSize=9.5, leading=14,
                              textColor=BRAND_DK, leftIndent=10, spaceAfter=9),
    "qnum": ParagraphStyle("qnum", fontName="Helvetica-Bold", fontSize=10.5, leading=14,
                           textColor=BRAND_DK, spaceAfter=2),
    "small": ParagraphStyle("small", fontName="Helvetica", fontSize=8.2, leading=11.5,
                            textColor=INK_SOFT, spaceAfter=6),
    "centre": ParagraphStyle("centre", fontName="Helvetica", fontSize=10, leading=15,
                             textColor=INK_BODY, alignment=TA_CENTER, spaceAfter=6),
    "centreb": ParagraphStyle("centreb", fontName="Helvetica-Bold", fontSize=15, leading=20,
                              textColor=BRAND_DK, alignment=TA_CENTER, spaceAfter=8),
}


def cover_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BRAND_DK)
    canvas.rect(0, 0, LETTER[0], LETTER[1], stroke=0, fill=1)
    canvas.setFillColor(BRAND)
    canvas.rect(0, 0, LETTER[0], 3.1 * inch, stroke=0, fill=1)
    canvas.setFillColor(GOLD)
    canvas.rect(0, LETTER[1] - 0.34 * inch, LETTER[0], 0.34 * inch, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#9fc4b6"))
    canvas.setFont("Helvetica", 8.5)
    canvas.drawString(0.9 * inch, 0.75 * inch, f"{SITE}   ·   {PHONE}   ·   {ADDRESS}")
    canvas.restoreState()


def inner_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BRAND)
    canvas.rect(0, LETTER[1] - 0.2 * inch, LETTER[0], 0.2 * inch, stroke=0, fill=1)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(0.9 * inch, 0.78 * inch, LETTER[0] - 0.9 * inch, 0.78 * inch)
    canvas.setFillColor(INK_SOFT)
    canvas.setFont("Helvetica", 7.6)
    canvas.drawString(0.9 * inch, 0.58 * inch,
                      "PrimeHome Buyers · 2026 As-Is Home Seller’s Blueprint")
    canvas.drawRightString(LETTER[0] - 0.9 * inch, 0.58 * inch, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()


def build():
    doc = BaseDocTemplate(OUT, pagesize=LETTER,
                          leftMargin=0.9 * inch, rightMargin=0.9 * inch,
                          topMargin=0.85 * inch, bottomMargin=1.0 * inch,
                          title="The 2026 As-Is Home Seller's Blueprint",
                          author="PrimeHome Buyers", subject="Selling a house as-is")

    cover_frame = Frame(0.9 * inch, 3.45 * inch, LETTER[0] - 1.8 * inch, 4.4 * inch, id="cover")
    inner_frame = Frame(0.9 * inch, 1.0 * inch, LETTER[0] - 1.8 * inch,
                        LETTER[1] - 1.85 * inch, id="inner")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=cover_bg),
        PageTemplate(id="inner", frames=[inner_frame], onPage=inner_bg),
    ])

    f = []
    P = lambda t, s="body": Paragraph(t, S[s])

    # ---------------------------------------------------------------- cover
    f += [
        P("PRIMEHOME BUYERS · SELLER RESOURCE", "eyebrow"),
        P("The 2026 As-Is<br/>Home Seller’s Blueprint", "title"),
        Spacer(1, 10),
        P("What to check before you spend a single dollar on repairs, "
          "what to ask any cash buyer before you sign, and how to sell a "
          "property that still has tenants in it.", "subtitle"),
        Spacer(1, 18),
        P("Written by people who buy houses for their own account — "
          "not by an agent trying to win a listing.", "subtitle"),
        NextPageTemplate("inner"),
        PageBreak(),
    ]

    # ------------------------------------------------------------ contents
    f += [
        P("What is in this guide", "h1"),
        Spacer(1, 4),
        P("Three things cost as-is sellers more money than anything else: "
          "repairing the wrong things, accepting an offer without asking what "
          "is behind it, and freezing when there is a tenant in the property. "
          "That is what this covers, and nothing else.", "lead"),
    ]
    toc = Table([
        ["Part 1", "The seven repair traps", "p. 3"],
        ["Part 2", "Ten questions to ask any direct buyer", "p. 5"],
        ["Part 3", "Tenants, probate and evictions", "p. 6"],
    ], colWidths=[0.85 * inch, 4.3 * inch, 0.8 * inch])
    toc.setStyle(TableStyle([
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 9.5),
        ("FONT", (1, 0), (1, -1), "Helvetica", 10.5),
        ("FONT", (2, 0), (2, -1), "Helvetica", 9.5),
        ("TEXTCOLOR", (0, 0), (0, -1), GOLD),
        ("TEXTCOLOR", (1, 0), (1, -1), INK),
        ("TEXTCOLOR", (2, 0), (2, -1), INK_SOFT),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, LINE),
    ]))
    f += [toc, Spacer(1, 22)]

    note = Table([[Paragraph(
        "<b>A word on where this comes from.</b> We buy houses directly, so we "
        "are not a neutral party and we are not pretending to be. Where our "
        "interests and yours differ, this guide says so — including in Part 2, "
        "which is a list of questions you should put to us as readily as to "
        "anyone else.", S["small"])]], colWidths=[LETTER[0] - 1.8 * inch])
    note.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_LT),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    f += [note, PageBreak()]

    # -------------------------------------------------------------- part 1
    f += [
        P("PART ONE", "kicker"),
        P("The seven repair traps", "h1"),
        P("Every one of these is money a seller spends to make a house more "
          "appealing, which the eventual buyer does not pay them back for. "
          "Some are worth doing anyway. Most are not.", "lead"),
    ]

    traps = [
        ("1. The pre-sale kitchen remodel",
         "A kitchen is the single most common place sellers spend before listing, and "
         "the one where taste differences bite hardest. A mid-range kitchen remodel "
         "rarely returns its full cost at resale, and an as-is buyer prices the house "
         "on condition and location rather than on finishes they did not choose.",
         "Instead: clean it, fix what does not work, and let the price reflect the "
         "kitchen. A buyer who wants a new kitchen would rather choose it."),
        ("2. Replacing a roof that could have been a credit",
         "A failing roof genuinely affects value and financing. But replacing it "
         "yourself means paying retail for labour and materials, on your timeline, "
         "under pressure. A buyer paying cash can often take the roof into account in "
         "the price instead.",
         "Instead: get one written estimate so you know the number, then ask whether "
         "the buyer will price it in rather than requiring the work be done first."),
        ("3. New flooring throughout",
         "Flooring is highly visible, which is why sellers reach for it, and highly "
         "personal, which is why it so often gets torn out again. Carpet in "
         "particular is frequently replaced by the next owner within two years.",
         "Instead: replace flooring only where it is a hazard or a smell. Otherwise "
         "leave it."),
        ("4. The full bathroom gut",
         "Gutting a bathroom means permits in many jurisdictions, a contractor "
         "schedule you do not control, and a real risk of opening up a wall and "
         "finding a plumbing problem you are now obliged to disclose and fix.",
         "Instead: fix leaks and running toilets. Those are cheap, and they are what "
         "an inspector writes up."),
        ("5. Landscaping and curb appeal overspend",
         "Tidy matters. Designed does not. Mature planting, retaining walls and "
         "irrigation systems are among the least recoverable outlays in residential "
         "property, because the next owner inherits the maintenance along with them.",
         "Instead: mow, cut back, clear the gutters, and stop. That is nearly the "
         "whole of the effect."),
        ("6. Discovering unpermitted work halfway through",
         "This is the trap that turns a cheap job expensive. You start a small repair "
         "on an older addition, a permit search happens, and now there is unpermitted "
         "work of record that must be disclosed and may need retrospective approval.",
         "Instead: if you suspect an addition was never permitted, find out before "
         "you touch it, and factor it into the sale rather than into a renovation."),
        ("7. Repairing to a standard the buyer will undo",
         "The most expensive version of every trap above. Work done to a high finish "
         "for a buyer who intends to renovate is money converted directly into "
         "landfill.",
         "Instead: ask the buyer what they intend to do with the property. If the "
         "answer is a full renovation, every repair you make first is a gift."),
    ]
    for title, why, instead in traps:
        f.append(KeepTogether([P(title, "h2"), P(why), P(instead, "instead")]))

    f.append(PageBreak())

    # -------------------------------------------------------------- part 2
    f += [
        P("PART TWO", "kicker"),
        P("Ten questions to ask any direct buyer", "h1"),
        P("Ask these of every cash buyer who contacts you, us included. A buyer "
          "who will not answer them plainly is telling you something useful.", "lead"),
    ]

    questions = [
        ("Are you buying this yourself, or assigning the contract to someone else?",
         "A wholesaler signs a contract with you and sells that contract on. That is a "
         "legal business, but it means the person you shook hands with is not the "
         "person buying, and the price can move. Ask directly."),
        ("Where do the funds come from, and can you show proof?",
         "“Cash” should mean cash. A recent bank statement or a letter from the "
         "institution holding the funds is a normal thing to ask for and a normal "
         "thing to provide."),
        ("Is this price subject to being reduced after an inspection?",
         "The most common way a strong offer becomes a weak one. Ask whether the "
         "number is final, or an opening position that gets revisited once they have "
         "walked the property."),
        ("What exactly comes out of my proceeds at closing?",
         "Get the list: title fees, escrow, recording, transfer taxes, outstanding "
         "property taxes, liens, HOA dues. “We cover closing costs” can mean several "
         "different things."),
        ("Which title or closing company, and who chooses it?",
         "You are entitled to know who is holding the money and handling the deed. In "
         "many states you can choose, or at least object."),
        ("What happens if I change my mind?",
         "Ask what you owe, if anything, at each stage — before signing, after "
         "signing, after the inspection period. Ask for it in writing."),
        ("Is there earnest money, and is it refundable to you or to me?",
         "Earnest money signals that the buyer is serious. A deposit that is fully "
         "refundable to the buyer for any reason signals rather less."),
        ("How long is this offer valid?",
         "A deadline of a few hours is a pressure tactic, not a business necessity. A "
         "real offer survives you sleeping on it."),
        ("Who pays outstanding taxes, liens and utility balances?",
         "These follow the property, not the person. Establish who clears them and at "
         "whose cost before you agree a number."),
        ("Can I speak to two people you bought from recently?",
         "The simplest question on this list and the most revealing. Any buyer doing "
         "real volume can produce two names."),
    ]
    for i, (q, a) in enumerate(questions, 1):
        f.append(KeepTogether([P(f"{i}. {q}", "qnum"), P(a)]))

    f.append(PageBreak())

    # -------------------------------------------------------------- part 3
    f += [
        P("PART THREE", "kicker"),
        P("Tenants, probate and evictions", "h1"),
        P("A property with a tenant in it, or one still working through an estate, "
          "is not unsellable. It is a different transaction, and the mistake is "
          "usually trying to make it look like an ordinary one first.", "lead"),

        P("Selling with a tenant still in place", "h2"),
        P("A tenancy generally survives the sale. The lease runs with the property, "
          "and the new owner steps into the landlord’s side of it. This means you do "
          "not have to remove a tenant in order to sell — and a buyer who intends to "
          "keep the property as a rental may prefer that you did not."),
        P("What matters is that the paperwork is straight: a copy of the lease, the "
          "rent roll, the deposit and where it is held, and any written notices "
          "already served. Gaps there are what slow a sale down, far more than the "
          "tenancy itself."),

        P("If the tenant has stopped paying", "h2"),
        P("Starting an eviction and then selling mid-process is usually the worst of "
          "both worlds: you carry the cost and the delay, and hand over a half-"
          "finished legal position. Either complete it before you sell, or price the "
          "property as it stands and let the buyer take the situation on."),
        P("Eviction is governed by state and local law, timelines are strict, and a "
          "procedural mistake early can cost months. Speak to a landlord-tenant "
          "attorney in your state before serving anything. This guide is general "
          "information and is not legal advice."),

        P("Inherited property and probate", "h2"),
        P("A house cannot usually be sold until someone has the legal authority to "
          "sell it — an executor or administrator appointed by the court. If that "
          "has not happened yet, that is the first step, and it is the one that sets "
          "the timeline."),
        P("Where several heirs share the property, all of them normally have to agree "
          "to the sale and sign. Establishing early who those people are, and whether "
          "they agree, prevents the most common cause of a collapsed estate sale."),

        P("Where a direct buyer actually helps", "h2"),
        P("These situations are exactly where selling to a buyer who pays cash and "
          "buys as-is is worth something concrete: no lender to satisfy, no appraisal "
          "conditioned on vacancy or condition, no requirement that repairs happen "
          "first, and a closing date that can be set around a court timetable rather "
          "than a mortgage approval."),
        P("It is worth less than it sounds if the property is clean, empty and "
          "financeable. Be honest with yourself about which of the two you have."),
    ]

    # ------------------------------------------------------------ back page
    f.append(PageBreak())
    f += [
        Spacer(1, 40),
        P("When you want a straight number", "centreb"),
        P("Tell us about the property and we will come back to you with an offer "
          "and the reasoning behind it. If it does not work for you, that is a "
          "perfectly good outcome and we will say so.", "centre"),
        Spacer(1, 18),
    ]
    contact = Table([
        ["Call or text", PHONE],
        ["Email", EMAIL],
        ["Online", SITE],
        ["Office", ADDRESS],
    ], colWidths=[1.6 * inch, 3.4 * inch])
    contact.setStyle(TableStyle([
        ("FONT", (0, 0), (0, -1), "Helvetica", 9),
        ("FONT", (1, 0), (1, -1), "Helvetica-Bold", 10.5),
        ("TEXTCOLOR", (0, 0), (0, -1), INK_SOFT),
        ("TEXTCOLOR", (1, 0), (1, -1), BRAND_DK),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
    ]))
    f += [contact, Spacer(1, 34)]

    disc = Table([[Paragraph(
        "<b>Important.</b> PrimeHome Buyers is a private buyer of residential real "
        "estate. We are not a real estate brokerage and we do not represent you. We "
        "are not a lender, a law firm, an accountancy practice or a financial adviser. "
        "Nothing in this guide is legal, tax or financial advice, and nothing in it is "
        "an offer to buy any particular property. Laws on tenancies, evictions and "
        "probate differ by state and change over time — take advice from a licensed "
        "professional in your own state before acting on anything here.<br/><br/>"
        "If you would rather we did not contact you, reply STOP to any text or use "
        f"the opt-out form at {SITE}/sms-opt-out.html — that stops calls as well as "
        "messages.", S["small"])]], colWidths=[LETTER[0] - 1.8 * inch])
    disc.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8faf9")),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    f.append(disc)

    doc.build(f)
    print("built", OUT)


if __name__ == "__main__":
    build()
