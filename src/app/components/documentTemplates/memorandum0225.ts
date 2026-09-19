import type { DocumentTemplate } from "./types";

const METADATA_TABLE = `
<table style="width:100%; border-collapse:collapse; margin:0 0 22px 0; font-size:1em; table-layout:fixed;">
  <tr>
    <td style="width:160px; padding:2px 0; vertical-align:top;"><strong>DATE</strong></td>
    <td style="width:14px; padding:2px 0; vertical-align:top;">:</td>
    <td style="padding:2px 0; vertical-align:top;">February 5, 2025</td>
  </tr>
  <tr>
    <td style="padding:2px 0; vertical-align:top;"><strong>MEMORANDUM NO.</strong></td>
    <td style="padding:2px 0; vertical-align:top;">:</td>
    <td style="padding:2px 0; vertical-align:top;">0225-102, Series 2025</td>
  </tr>
  <tr>
    <td style="padding:2px 0; vertical-align:top;"><strong>FROM</strong></td>
    <td style="padding:2px 0; vertical-align:top;">:</td>
    <td style="padding:2px 0; vertical-align:top;">
      <strong>Dr. Eingilbert C. Benolirao</strong><br/>
      Campus Director
    </td>
  </tr>
  <tr>
    <td style="padding:2px 0; vertical-align:top;"><strong>TO</strong></td>
    <td style="padding:2px 0; vertical-align:top;">:</td>
    <td style="padding:2px 0; vertical-align:top;">
      Dr. Fitzgerald C. Kintanar &ndash; <em>Dean of Instruction</em><br/>
      Ms. Evangeline C. Rellin &ndash; <em>Dean, Student Affairs Office</em><br/>
      Dr. Ariel L. Ramos &ndash; <em>Dean, Graduate School</em><br/>
      Dr. Jorelyn P. Concepcion &ndash; <em>Dean, COED</em><br/>
      Dr. Luiscel Teofi E. Cabico &ndash; <em>Dean, College of Arts and Sciences</em><br/>
      Dr. Helmer M. Banados &ndash; <em>Dean, College of Tech. &amp; Engineering</em><br/>
      Mr. Leoncio V. Boltiodar &ndash; <em>Dean, College of HMT</em><br/>
      Dr. Steve Michael T. Alcazar &ndash; <em>Dean, CAFE</em><br/>
      <strong>ALL PROGRAM CHAIRS</strong><br/>
      <strong>ALL STUDENTS</strong>
    </td>
  </tr>
  <tr>
    <td style="padding:2px 0; vertical-align:top;"><strong>SUBJECT</strong></td>
    <td style="padding:2px 0; vertical-align:top;">:</td>
    <td style="padding:2px 0; vertical-align:top;">
      <strong>UPDATE ON THE WEARING OF SCHOOL UNIFORM EFFECTIVE 2<sup>ND</sup> SEMESTER A.Y. 2024-2025</strong>
    </td>
  </tr>
</table>`;

const BODY = `
<p style="margin:0 0 12px 0; text-align:justify; line-height:1.4;">
  As per the attached approved request, please be informed that this is to shed light on the queries
  and clarifications regarding the compliance of students in the wearing of school uniform effective
  this 2<sup>nd</sup> semester of A.Y. 2024-2025.
</p>

<p style="margin:0 0 10px 0; text-align:justify; line-height:1.4;">
  For the information of all CTU Argao students and concerned individuals, the following are to be adhered to:
</p>

<p style="margin:0 0 6px 0; text-align:justify; line-height:1.4; padding-left:28px; text-indent:-14px;">
  a.&nbsp;&nbsp;School uniform include referring to the University/CTU Uniform, Campus/Departmental uniform.
</p>

<p style="margin:0 0 10px 0; text-align:justify; line-height:1.4; padding-left:28px; text-indent:-14px;">
  b.&nbsp;&nbsp;Effectivity dates of wearing are as follows:
</p>

<p style="margin:0 0 14px 0; text-align:justify; line-height:1.4; padding-left:56px; text-indent:-24px;">
  <strong>February 3, 2025 -</strong> for 2<sup>nd</sup> year, and; <strong>February 3, 2025 - 3<sup>rd</sup> year
  and 4<sup>th</sup> year students</strong> (until the first semester of the academic year 2025-2026), and;
  <strong>February 10, 2025 - for all 1<sup>st</sup> year &amp; transferee students/returnees.</strong>
</p>

<h2 style="margin:18px 0 10px 0; font-size:1.08em; font-weight:700; text-transform:uppercase; letter-spacing:0.02em;">
  CONSIDERATIONS:
</h2>

<p style="margin:0 0 12px 0; text-align:justify; line-height:1.4;">
  First year and second year students are expected to wear the COMPLETE CTU prescribed uniform on
  February 10, 2025; if uniforms are not yet available or still under tailoring/sewing process at the
  date of compliance, the student must have to submit a valid PROOF to justify the unavailability.
  (Uniform Pass Slip will be provided SOON).
</p>

<p style="margin:0 0 6px 0; text-align:justify; line-height:1.4;">
  For third year and fourth year students:
</p>

<p style="margin:0 0 12px 0; text-align:justify; line-height:1.4;">
  it is encouraged to wear the CTU prescribed uniform, if it is available; moreover, is not
  absolutely mandatory; however, as an alternative, MUST have to use the Departmental polo (T) shirt
  and/or OJT uniform and depending on what is prescribed or preferred by the Program that suits the
  applicability of the OJT timelines;
</p>

<p style="margin:0 0 12px 0; text-align:justify; line-height:1.4;">
  &ndash; (identified) LGBTQ+ students may opt to adhere to gender-neutrality provided with
  consideration to preserving and maintaining the INTEGRITY of the institution and being a
  values-oriented CTU student;
</p>

<p style="margin:0 0 12px 0; text-align:justify; line-height:1.4;">
  &ndash; Skirts and/or pants must NOT be SKIMPY or too TIGHT in cut or style.
</p>

<p style="margin:0 0 10px 0; text-align:justify; line-height:1.4;">
  Generally, for the information and guidance of all students;
</p>

<p style="margin:0 0 8px 0; text-align:justify; line-height:1.4; padding-left:22px; text-indent:-14px;">
  &ndash; Do strictly adhere to the appropriate manner of wearing uniforms, the Departmental or OJT
  t-shirt must be paired with SLACKS/PANTS and black shoes, NOT JEANS along with the School ID;
</p>

<p style="margin:0 0 8px 0; text-align:justify; line-height:1.4; padding-left:22px; text-indent:-14px;">
  &ndash; Skirt must not be higher than 1 inch above the knee and must be paired with black,
  closed-shoes and school ID;
</p>

<p style="margin:0 0 14px 0; text-align:justify; line-height:1.4; padding-left:22px; text-indent:-14px;">
  &ndash; Was day/type C (Departmental shirts) must still be abided every Wednesday and is always
  subjected to the appropriate wearing of uniform protocols.
</p>

<p style="margin:0 0 12px 0; text-align:justify; line-height:1.4;">
  For further details, please refer to the attached letter request from the Dean, Student Affairs
  Services (SAS).
</p>

<p style="margin:0 0 40px 0; text-align:justify; line-height:1.4;">
  For information and guidance.
</p>

<div style="margin-top:56px; text-align:right; padding-right:60px;">
  <p style="margin:0 0 56px 0; font-weight:700; font-size:1em; letter-spacing:0.02em;">
    EINGILBERT C. BENOLIRAO, Dev.Ed.D.
  </p>
  <p style="margin:0; font-style:italic; font-size:1em;">Campus Director</p>
</div>
`;

export const memorandum0225: DocumentTemplate = {
  id: "memorandum-0225-102",
  title: "Memorandum 0225-102, s. 2025",
  description:
    "Update on the Wearing of School Uniform Effective 2nd Semester A.Y. 2024-2025 — CTU Argao Campus.",
  category: "Memorandum",
  fileName: "Memorandum_0225-102_Series_2025",
  pageSize: "short",
  font: "serif",
  lineSpacing: "1.15",
  html: METADATA_TABLE + BODY,
};