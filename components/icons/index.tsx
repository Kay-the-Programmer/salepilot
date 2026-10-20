import React from "react";
import type { IconBaseProps } from "react-icons";
import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineArchiveBox,
    HiOutlineArrowDownTray,
    HiOutlineArrowLeft,
    HiOutlineArrowPath,
    HiOutlineArrowRight,
    HiOutlineArrowTrendingDown,
    HiOutlineArrowTrendingUp,
    HiOutlineArrowUpTray,
    HiOutlineArrowUturnLeft,
    HiOutlineBanknotes,
    HiOutlineBars3,
    HiOutlineBellAlert,
    HiOutlineBolt,
    HiOutlineBookOpen,
    HiOutlineBuildingLibrary,
    HiOutlineBuildingOffice,
    HiOutlineBuildingStorefront,
    HiOutlineCalculator,
    HiOutlineCalendar,
    HiOutlineCalendarDays,
    HiOutlineCamera,
    HiOutlineChartBar,
    HiOutlineChatBubbleLeftRight,
    HiOutlineCheckCircle,
    HiOutlineChevronDown,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineClipboardDocumentList,
    HiOutlineClock,
    HiOutlineCreditCard,
    HiOutlineCube,
    HiOutlineCurrencyDollar,
    HiOutlineDevicePhoneMobile,
    HiOutlineDocumentChartBar,
    HiOutlineDocumentText,
    HiOutlineEllipsisVertical,
    HiOutlineEnvelope,
    HiOutlineExclamationTriangle,
    HiOutlineEye,
    HiOutlineFolder,
    HiOutlineFolderOpen,
    HiOutlineFunnel,
    HiOutlineHome,
    HiOutlineInformationCircle,
    HiOutlineListBullet,
    HiOutlineMagnifyingGlass,
    HiOutlineMapPin,
    HiOutlineMinus,
    HiOutlinePaperAirplane,
    HiOutlinePencil,
    HiOutlinePhone,
    HiOutlinePlus,
    HiOutlinePrinter,
    HiOutlineQrCode,
    HiOutlineReceiptPercent,
    HiOutlineScale,
    HiOutlineShieldCheck,
    HiOutlineShoppingBag,
    HiOutlineShoppingCart,
    HiOutlineSparkles,
    HiOutlineSquares2X2,
    HiOutlineTag,
    HiOutlineTrash,
    HiOutlineTruck,
    HiOutlineUser,
    HiOutlineUserCircle,
    HiOutlineUsers,
    HiOutlineXCircle,
    HiOutlineXMark,
} from "react-icons/hi2";

/**
 * Every line icon in the app, in one place.
 *
 * These used to be 107 hand-written SVG components, each a copy of a
 * Heroicon. They were copies of the `react-icons/hi2` set we already
 * depend on, and they had drifted from it: a few carried path data from an
 * older Heroicons release, so the same icon rendered differently depending
 * on which screen you were looking at. Re-exporting the dependency instead
 * means one vocabulary, upstream maintenance, and no file to forget to
 * update.
 *
 * The names are kept exactly as they were so no import site had to change.
 * A handful are Heroicons-v1-era names that v2 renamed (Search →
 * MagnifyingGlass, Refresh → ArrowPath, Bank → BuildingLibrary and so on);
 * those aliases are resolved here rather than at ~100 call sites.
 *
 * `w-6 h-6` is the default size the hand-written components applied, so
 * callers that pass no className keep the size they had. A caller that does
 * pass one replaces it, as before.
 */
const sized = (Inner: React.ComponentType<IconBaseProps>) => {
    const Icon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
        <Inner className={className ?? "w-6 h-6"} {...(props as IconBaseProps)} />
    );
    Icon.displayName = Inner.name;
    return Icon;
};

export const AdjustmentsHorizontalIcon = sized(HiOutlineAdjustmentsHorizontal);
export const ArchiveBoxIcon = sized(HiOutlineArchiveBox);
export const ArrowDownTrayIcon = sized(HiOutlineArrowDownTray);
export const ArrowLeftIcon = sized(HiOutlineArrowLeft);
export const ArrowRightIcon = sized(HiOutlineArrowRight);
export const ArrowTrendingDownIcon = sized(HiOutlineArrowTrendingDown);
export const ArrowTrendingUpIcon = sized(HiOutlineArrowTrendingUp);
export const ArrowUpTrayIcon = sized(HiOutlineArrowUpTray);
export const BankIcon = sized(HiOutlineBuildingLibrary);
export const BanknotesIcon = sized(HiOutlineBanknotes);
export const Bars3Icon = sized(HiOutlineBars3);
export const BellAlertIcon = sized(HiOutlineBellAlert);
export const BoltIcon = sized(HiOutlineBolt);
export const BookOpenIcon = sized(HiOutlineBookOpen);
export const BuildingOfficeIcon = sized(HiOutlineBuildingOffice);
export const BuildingStorefrontIcon = sized(HiOutlineBuildingStorefront);
export const CalculatorIcon = sized(HiOutlineCalculator);
export const CalendarDaysIcon = sized(HiOutlineCalendarDays);
export const CalendarIcon = sized(HiOutlineCalendar);
export const CameraIcon = sized(HiOutlineCamera);
export const ChartBarIcon = sized(HiOutlineChartBar);
export const ChatBubbleLeftRightIcon = sized(HiOutlineChatBubbleLeftRight);
export const CheckCircleIcon = sized(HiOutlineCheckCircle);
export const ChevronDownIcon = sized(HiOutlineChevronDown);
export const ChevronLeftIcon = sized(HiOutlineChevronLeft);
export const ChevronRightIcon = sized(HiOutlineChevronRight);
export const ClipboardDocumentListIcon = sized(HiOutlineClipboardDocumentList);
export const ClockIcon = sized(HiOutlineClock);
export const CreditCardIcon = sized(HiOutlineCreditCard);
export const CubeIcon = sized(HiOutlineCube);
export const CurrencyDollarIcon = sized(HiOutlineCurrencyDollar);
export const DevicePhoneMobileIcon = sized(HiOutlineDevicePhoneMobile);
export const DocumentChartBarIcon = sized(HiOutlineDocumentChartBar);
export const DocumentTextIcon = sized(HiOutlineDocumentText);
export const EllipsisVerticalIcon = sized(HiOutlineEllipsisVertical);
export const EnvelopeIcon = sized(HiOutlineEnvelope);
export const ExclamationTriangleIcon = sized(HiOutlineExclamationTriangle);
export const EyeIcon = sized(HiOutlineEye);
export const FilterIcon = sized(HiOutlineFunnel);
export const FolderIcon = sized(HiOutlineFolder);
export const FolderOpenIcon = sized(HiOutlineFolderOpen);
export const GridIcon = sized(HiOutlineSquares2X2);
export const HomeIcon = sized(HiOutlineHome);
export const InformationCircleIcon = sized(HiOutlineInformationCircle);
export const ListIcon = sized(HiOutlineListBullet);
export const MagnifyingGlassIcon = sized(HiOutlineMagnifyingGlass);
export const MapPinIcon = sized(HiOutlineMapPin);
export const MinusIcon = sized(HiOutlineMinus);
export const PaperAirplaneIcon = sized(HiOutlinePaperAirplane);
export const PencilIcon = sized(HiOutlinePencil);
export const PhoneIcon = sized(HiOutlinePhone);
export const PlusIcon = sized(HiOutlinePlus);
export const PrinterIcon = sized(HiOutlinePrinter);
export const QrCodeIcon = sized(HiOutlineQrCode);
export const ReceiptPercentIcon = sized(HiOutlineReceiptPercent);
export const RefreshIcon = sized(HiOutlineArrowPath);
export const RestoreIcon = sized(HiOutlineArrowUturnLeft);
export const Scale = sized(HiOutlineScale);
export const ScaleIcon = sized(HiOutlineScale);
export const SearchIcon = sized(HiOutlineMagnifyingGlass);
export const ShieldCheckIcon = sized(HiOutlineShieldCheck);
export const ShoppingBagIcon = sized(HiOutlineShoppingBag);
export const ShoppingCartIcon = sized(HiOutlineShoppingCart);
export const SparklesIcon = sized(HiOutlineSparkles);
export const TagIcon = sized(HiOutlineTag);
export const TrashIcon = sized(HiOutlineTrash);
export const TruckIcon = sized(HiOutlineTruck);
export const UserCircleIcon = sized(HiOutlineUserCircle);
export const UserIcon = sized(HiOutlineUser);
export const UsersIcon = sized(HiOutlineUsers);
export const XCircleIcon = sized(HiOutlineXCircle);
export const XMarkIcon = sized(HiOutlineXMark);
