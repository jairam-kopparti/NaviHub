import svgPaths from "../public/bell";
import imgFrame3 from "figma:asset/f0984e44fbd6faee945cb2d348e0e4a4cbd2a122.png";
import logoImage from "figma:asset/7644bc394dd8fa4df3e5d4226874e1f41232a897.png";

function Frame4() {
  return (
    <div className="content-stretch flex gap-[30px] items-center justify-center relative shrink-0">
      <Link href="/">
        <p className="font-['Open_Sans:Regular',_sans-serif] font-normal leading-[normal] relative shrink-0 text-[#1f1f1f] text-[18px] text-nowrap whitespace-pre cursor-pointer hover:opacity-70 transition-opacity" style={{ fontVariationSettings: "'wdth' 100" }}>
          Home
        </p>
      </Link>
      <div className="relative shrink-0 size-[7px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
          <circle cx="3.5" cy="3.5" fill="var(--fill-0, #1F1F1F)" id="Ellipse 1" r="3.5" />
        </svg>
      </div>
      <Link href="/resources">
        <p className="font-['Open_Sans:Regular',_sans-serif] font-normal leading-[normal] relative shrink-0 text-[#909090] text-[18px] text-nowrap whitespace-pre cursor-pointer hover:opacity-70 transition-opacity" style={{ fontVariationSettings: "'wdth' 100" }}>
          Resources
        </p>
      </Link>
      <div className="relative shrink-0 size-[7px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
          <circle cx="3.5" cy="3.5" fill="var(--fill-0, #1F1F1F)" id="Ellipse 1" r="3.5" />
        </svg>
      </div>
      <Link href="/form">
        <p className="font-['Open_Sans:Regular',_sans-serif] font-normal leading-[normal] relative shrink-0 text-[#909090] text-[18px] text-nowrap whitespace-pre cursor-pointer hover:opacity-70 transition-opacity" style={{ fontVariationSettings: "'wdth' 100" }}>
          Form
        </p>
      </Link>
      <div className="relative shrink-0 size-[7px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
          <circle cx="3.5" cy="3.5" fill="var(--fill-0, #1F1F1F)" id="Ellipse 1" r="3.5" />
        </svg>
      </div>
      <Link href="/about">
        <p className="font-['Open_Sans:Regular',_sans-serif] font-normal leading-[normal] relative shrink-0 text-[#909090] text-[18px] text-nowrap whitespace-pre cursor-pointer hover:opacity-70 transition-opacity" style={{ fontVariationSettings: "'wdth' 100" }}>
          About
        </p>
      </Link>
    </div>
  );
}

function ClarityNotificationLine() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="clarity:notification-line">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g clipPath="url(#clip0_1_64)" id="clarity:notification-line">
          <path d={svgPaths.pe509380} fill="var(--fill-0, #909090)" id="Vector" />
          <path d={svgPaths.p15576540} fill="var(--fill-0, #909090)" id="Vector_2" />
          <g id="Vector_3"></g>
        </g>
        <defs>
          <clipPath id="clip0_1_64">
            <rect fill="white" height="28" width="28" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0">
      <ClarityNotificationLine />
    </div>
  );
}

function Frame1() {
  return (
    <div className="box-border content-stretch flex items-center justify-between px-[50px] py-[15px] relative rounded-[100px] shrink-0 w-[983px]">
      <div aria-hidden="true" className="absolute border border-[rgba(144,144,144,0.2)] border-solid inset-0 pointer-events-none rounded-[100px]" />
      <Frame4 />
      <Frame3 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="relative rounded-[100px] shrink-0 size-[45px]">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[100px]">
        <div className="absolute bg-white inset-0 rounded-[100px]" />
        <img alt="" className="absolute max-w-none object-50%-50% object-cover rounded-[100px] size-full" src={imgFrame3} />
      </div>
      <div className="flex flex-row items-center size-full">
        <div className="size-[45px]" />
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="box-border content-stretch flex gap-[10px] h-[58px] items-center px-[10px] py-[15px] relative rounded-[100px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[rgba(144,144,144,0.2)] border-solid inset-0 pointer-events-none rounded-[100px]" />
      <Frame8 />
      <p className="font-['Open_Sans:Regular',_sans-serif] font-normal leading-[normal] relative shrink-0 text-[#909090] text-[18px] text-nowrap whitespace-pre" style={{ fontVariationSettings: "'wdth' 100" }}>
        Patrika K.
      </p>
    </div>
  );
}

export default function Navbar() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[80px] top-[44px] w-[1280px]">
      <Link href="/">
        <img src={logoImage} alt="NAVI HUB Logo" className="h-[26px] w-auto cursor-pointer hover:opacity-80 transition-opacity" />
      </Link>
      <Frame1 />
      <Frame5 />
    </div>
  );
}
