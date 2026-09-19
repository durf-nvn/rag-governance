import type { DocumentTemplate } from "./types";

const METADATA_TABLE = `
<table style="width:100%; border-collapse:collapse; margin:0 0 22px 0; font-size:1em; table-layout:fixed;">
  <tr>
    <td style="width:210px; padding:2px 0; vertical-align:top;"><strong>DATE</strong></td>
    <td style="width:14px; padding:2px 0; vertical-align:top;">:</td>
    <td style="padding:2px 0; vertical-align:top;">July 21, 2026</td>
  </tr>
  <tr>
    <td style="padding:2px 0; vertical-align:top;"><strong>CTU MEMORANDUM NO</strong></td>
    <td style="padding:2px 0; vertical-align:top;">:</td>
    <td style="padding:2px 0; vertical-align:top;">PG21-226, s. 2026</td>
  </tr>
  <tr>
    <td style="padding:2px 0; vertical-align:top;"><strong>TO</strong></td>
    <td style="padding:2px 0; vertical-align:top;">:</td>
    <td style="padding:2px 0; vertical-align:top;"><strong>ALL CAMPUS DIRECTORS</strong></td>
  </tr>
  <tr>
    <td style="padding:2px 0; vertical-align:top;"><strong>ATTENTION</strong></td>
    <td style="padding:2px 0; vertical-align:top;">:</td>
    <td style="padding:2px 0; vertical-align:top;">
      <strong>ALL DEANS OF STUDENT AFFAIRS/SERVICES</strong><br/>
      <strong>ALL SSG OFFICERS AND ADVISERS</strong>
    </td>
  </tr>
  <tr>
    <td style="padding:2px 0; vertical-align:top;"><strong>SUBJECT</strong></td>
    <td style="padding:2px 0; vertical-align:top;">:</td>
    <td style="padding:2px 0; vertical-align:top;">
      <strong>REITERATION OF THE OFFICIAL FABRIC PROVIDER FOR ALL CTU CAMPUSES</strong>
    </td>
  </tr>
</table>`;

const BODY = `
<p style="margin:0 0 12px 0; text-align:justify; line-height:1.4;">
  <strong>1.</strong>&nbsp;&nbsp;&nbsp;&nbsp;Uniformity in the procurement of fabrics, clear operational
  guidelines for handling orders, collections, and distributions, and the consistent implementation
  of institutional agreements remain essential across the university system. Accordingly, this
  Memorandum is issued to reiterate the designated official fabric provider for all campuses.
</p>

<p style="margin:0 0 12px 0; text-align:justify; line-height:1.4;">
  <strong>2.</strong>&nbsp;&nbsp;&nbsp;&nbsp;In line with the existing Memorandum of Agreement (MOA) duly
  executed between the Federation of Student Governments (FSG)-CTU Inc. and Michelle's Apparel,
  Michelle's Apparel shall remain the official and exclusive fabric provider for all Cebu
  Technological University campuses.
</p>

<p style="margin:0 0 8px 0; text-align:justify; line-height:1.4;">
  <strong>3.</strong>&nbsp;&nbsp;&nbsp;&nbsp;The Supreme Student Government (SSG) of each respective campus is
  hereby designated as the official coordinating body responsible for:
</p>

<p style="margin:0 0 6px 0; text-align:justify; line-height:1.4; padding-left:44px; text-indent:-22px;">
  a)&nbsp;&nbsp;Receiving and consolidating fabric orders;
</p>
<p style="margin:0 0 6px 0; text-align:justify; line-height:1.4; padding-left:44px; text-indent:-22px;">
  b)&nbsp;&nbsp;Facilitating the collection and processing of payments;
</p>
<p style="margin:0 0 6px 0; text-align:justify; line-height:1.4; padding-left:44px; text-indent:-22px;">
  c)&nbsp;&nbsp;Coordinating directly with Michelle's Apparel for procurement; and
</p>
<p style="margin:0 0 14px 0; text-align:justify; line-height:1.4; padding-left:44px; text-indent:-22px;">
  d)&nbsp;&nbsp;Distributing the fabrics to concerned students within their respective campuses.
</p>

<p style="margin:0 0 12px 0; text-align:justify; line-height:1.4;">
  <strong>4.</strong>&nbsp;&nbsp;&nbsp;&nbsp;All collections and financial transactions arising from the
  procurement and distribution of fabrics must be properly documented, accounted for, and supported
  by the necessary financial reports. These reports shall be submitted to the respective Student
  Affairs Office (SAO) Dean/Head of each campus in compliance with existing University financial
  policies and auditing procedures.
</p>

<p style="margin:0 0 40px 0; text-align:justify; line-height:1.4;">
  <strong>5.</strong>&nbsp;&nbsp;&nbsp;&nbsp;For your immediate information, guidance, and strict compliance.
</p>

<div style="margin-top:56px; text-align:left;">
  <p style="margin:0 0 56px 0; font-weight:700; font-size:1em; letter-spacing:0.02em;">
    JONITA V. LITERATUS, Ph.D.
  </p>
  <p style="margin:0; font-style:italic; font-size:1em;">OIC-University President</p>
</div>
`;

export const memorandumPG21: DocumentTemplate = {
  id: "memorandum-pg21-226",
  title: "CTU Memorandum PG21-226, s. 2026",
  description:
    "Reiteration of the Official Fabric Provider for All CTU Campuses — Office of the University President.",
  category: "Memorandum",
  fileName: "CTU_Memorandum_PG21-226_s2026",
  pageSize: "short",
  font: "serif",
  lineSpacing: "1.15",
  html: METADATA_TABLE + BODY,
};