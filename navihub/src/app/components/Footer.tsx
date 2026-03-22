import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-(--surface) text-(--secondary-text)">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center space-y-8 md:space-y-0">
        <div className="flex flex-col gap-2">
          <h4 className="footer-heading">Quick Links</h4>
          <Link href="/" className="footer-link">
            Home
          </Link>
          <Link href="/pages/resources" className="footer-link">
            Resources
          </Link>
          <Link href="/pages/events" className="footer-link">
            Events
          </Link>
          <Link href="/pages/NaviLink" className="footer-link">
            NaviLink
          </Link>
          <Link href="/pages/about" className="footer-link">
            About
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="footer-heading">Hours of Operation</h4>
          <span className="footer-text">Mon - Fri: 7:00 AM - 8:00 PM</span>
          <span className="footer-text">Sat: 8:00 AM - 6:00 PM</span>
          <span className="footer-text">Sun: 8:00 AM - 5:00 PM</span>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto">
          <h4 className="footer-heading">Find Us</h4>
          <div className="w-full md:w-64 h-36 rounded-lg overflow-hidden border border-(--border)">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3021.8088355511874!2d-74.0142912845943!3d40.70956994511227!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a197fd0e3f3%3A0x482cdd582cb4c6af!2s101%20Liberty%20St%2C%20New%20York%2C%20NY%2010007%2C%20USA!5e0!3m2!1sen!2sus!4v1695041045182!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-(--border) bg-(--surface) py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-(--secondary-text)">
          <img src="/main_logo.png" alt="NaviHub Logo" className="h-10 mb-2 md:mb-0" />
          <span className="footer-text">© 2026 TSA Webmaster All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
