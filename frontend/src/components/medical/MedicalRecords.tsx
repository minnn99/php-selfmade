import React, { useState, useEffect } from "react";
import { userDataAPI } from "../../services/api";
import { Pagination } from "../ui/Pagination";

interface MedicalRecordsProps {
  className?: string;
}

interface HospitalVisit {
  id: string;
  date: string;
  hospitalName: string;
  doctorName: string;
  department: string;
  purpose: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  nextVisit?: string;
}

interface TestResult {
  id: string;
  date: string;
  testType: string;
  hospitalName: string;
  results: string;
  referenceValues: string;
  notes: string;
  files?: File[];
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedDate: string;
  prescribedBy: string;
  purpose: string;
  sideEffects?: string;
  notes?: string;
  isActive: boolean;
}

type RecordType = "visit" | "test" | "medication";

export const MedicalRecords: React.FC<MedicalRecordsProps> = ({ className = "" }) => {
  const [activeTab, setActiveTab] = useState<RecordType>("visit");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  // Data states
  const [hospitalVisits, setHospitalVisits] = useState<HospitalVisit[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  // Pagination states
  const [visitCurrentPage, setVisitCurrentPage] = useState(1);
  const [testCurrentPage, setTestCurrentPage] = useState(1);
  const [medicationCurrentPage, setMedicationCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [visitForm, setVisitForm] = useState<Partial<HospitalVisit>>({});
  const [testForm, setTestForm] = useState<Partial<TestResult>>({});
  const [medicationForm, setMedicationForm] = useState<Partial<Medication>>({});

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await userDataAPI.getMedicalRecords();
      if (response.success) {
        const responseData = response.data as { hospitalVisits?: HospitalVisit[]; testResults?: TestResult[]; medications?: Medication[] };
        setHospitalVisits(responseData.hospitalVisits || []);
        setTestResults(responseData.testResults || []);
        setMedications(responseData.medications || []);
      }
    } catch {
      // Failed to load medical records
    }
  };

  // Pagination helper functions
  const getPaginatedData = <T,>(data: T[], currentPage: number): { paginatedData: T[]; totalPages: number } => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    return { paginatedData, totalPages };
  };

  const getCurrentPageData = () => {
    switch (activeTab) {
      case "visit":
        return getPaginatedData(hospitalVisits, visitCurrentPage);
      case "test":
        return getPaginatedData(testResults, testCurrentPage);
      case "medication":
        return getPaginatedData(medications, medicationCurrentPage);
      default:
        return { paginatedData: [], totalPages: 0 };
    }
  };

  const handlePageChange = (page: number) => {
    switch (activeTab) {
      case "visit":
        setVisitCurrentPage(page);
        break;
      case "test":
        setTestCurrentPage(page);
        break;
      case "medication":
        setMedicationCurrentPage(page);
        break;
    }
  };

  const getCurrentPage = () => {
    switch (activeTab) {
      case "visit":
        return visitCurrentPage;
      case "test":
        return testCurrentPage;
      case "medication":
        return medicationCurrentPage;
      default:
        return 1;
    }
  };

  const saveToStorage = async (type: RecordType, data: HospitalVisit[] | TestResult[] | Medication[]) => {
    try {
      let apiType: "hospitalVisits" | "testResults" | "medications";
      switch (type) {
        case "visit":
          apiType = "hospitalVisits";
          setHospitalVisits(data as HospitalVisit[]);
          break;
        case "test":
          apiType = "testResults";
          setTestResults(data as TestResult[]);
          break;
        case "medication":
          apiType = "medications";
          setMedications(data as Medication[]);
          break;
      }
      
      const response = await userDataAPI.saveMedicalRecords(apiType, data);
      
      if (!response.success) {
        throw new Error(`API呼び出し失敗: ${response.message || 'Unknown error'}`);
      }
    } catch {
      alert("データの保存に失敗しました。ネットワーク接続を確認してください。");
    }
  };

  const handleAddRecord = () => {
    const newId = Date.now().toString();

    switch (activeTab) {
      case "visit": {
        if (!visitForm.date || !visitForm.hospitalName) {
          alert("日付と病院名は必須です");
          return;
        }
        const newVisit: HospitalVisit = {
          id: newId,
          date: visitForm.date || "",
          hospitalName: visitForm.hospitalName || "",
          doctorName: visitForm.doctorName || "",
          department: visitForm.department || "",
          purpose: visitForm.purpose || "",
          symptoms: visitForm.symptoms || "",
          diagnosis: visitForm.diagnosis || "",
          notes: visitForm.notes || "",
          nextVisit: visitForm.nextVisit,
        };
        saveToStorage("visit", [...hospitalVisits, newVisit]);
        setVisitForm({});
        break;
      }

      case "test": {
        if (!testForm.date || !testForm.testType) {
          alert("日付と検査種類は必須です");
          return;
        }
        const newTest: TestResult = {
          id: newId,
          date: testForm.date || "",
          testType: testForm.testType || "",
          hospitalName: testForm.hospitalName || "",
          results: testForm.results || "",
          referenceValues: testForm.referenceValues || "",
          notes: testForm.notes || "",
        };
        saveToStorage("test", [...testResults, newTest]);
        setTestForm({});
        break;
      }

      case "medication": {
        if (!medicationForm.name || !medicationForm.prescribedDate) {
          alert("薬名と処方日は必須です");
          return;
        }
        const newMedication: Medication = {
          id: newId,
          name: medicationForm.name || "",
          dosage: medicationForm.dosage || "",
          frequency: medicationForm.frequency || "",
          duration: medicationForm.duration || "",
          prescribedDate: medicationForm.prescribedDate || "",
          prescribedBy: medicationForm.prescribedBy || "",
          purpose: medicationForm.purpose || "",
          sideEffects: medicationForm.sideEffects,
          notes: medicationForm.notes,
          isActive: true,
        };
        saveToStorage("medication", [...medications, newMedication]);
        setMedicationForm({});
        break;
      }
    }

    setShowAddForm(false);
  };

  const handleEditRecord = (id: string) => {
    setEditingRecord(id);
    switch (activeTab) {
      case "visit": {
        const visit = hospitalVisits.find((v) => v.id === id);
        if (visit) setVisitForm(visit);
        break;
      }
      case "test": {
        const test = testResults.find((t) => t.id === id);
        if (test) setTestForm(test);
        break;
      }
      case "medication": {
        const medication = medications.find((m) => m.id === id);
        if (medication) setMedicationForm(medication);
        break;
      }
    }
    setShowAddForm(true);
  };

  const handleUpdateRecord = () => {
    if (!editingRecord) return;

    switch (activeTab) {
      case "visit": {
        const updatedVisits = hospitalVisits.map((v) => (v.id === editingRecord ? { ...v, ...visitForm } : v));
        saveToStorage("visit", updatedVisits);
        setVisitForm({});
        break;
      }
      case "test": {
        const updatedTests = testResults.map((t) => (t.id === editingRecord ? { ...t, ...testForm } : t));
        saveToStorage("test", updatedTests);
        setTestForm({});
        break;
      }
      case "medication": {
        const updatedMedications = medications.map((m) => (m.id === editingRecord ? { ...m, ...medicationForm } : m));
        saveToStorage("medication", updatedMedications);
        setMedicationForm({});
        break;
      }
    }

    setEditingRecord(null);
    setShowAddForm(false);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("この記録を削除しますか？")) return;

    try {
      switch (activeTab) {
        case "visit":
          await saveToStorage(
            "visit",
            hospitalVisits.filter((v) => v.id !== id)
          );
          break;
        case "test":
          await saveToStorage(
            "test",
            testResults.filter((t) => t.id !== id)
          );
          break;
        case "medication":
          await saveToStorage(
            "medication",
            medications.filter((m) => m.id !== id)
          );
          break;
      }
    } catch {
      // Silent error handling - deletion failed
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  const tabs = [
    { id: "visit", label: "病院受診", icon: "" },
    { id: "test", label: "検査結果", icon: "" },
    { id: "medication", label: "処方薬", icon: "" },
  ];

  const renderVisitForm = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">受診日 *</label>
          <input
            type="date"
            value={visitForm.date || ""}
            onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">病院名 *</label>
          <input
            type="text"
            value={visitForm.hospitalName || ""}
            onChange={(e) => setVisitForm({ ...visitForm, hospitalName: e.target.value })}
            placeholder="中央医療センター"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">医師名</label>
          <input
            type="text"
            value={visitForm.doctorName || ""}
            onChange={(e) => setVisitForm({ ...visitForm, doctorName: e.target.value })}
            placeholder="田中 太郎"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">診療科</label>
          <input
            type="text"
            value={visitForm.department || ""}
            onChange={(e) => setVisitForm({ ...visitForm, department: e.target.value })}
            placeholder="婦人科"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">受診目的</label>
        <input
          type="text"
          value={visitForm.purpose || ""}
          onChange={(e) => setVisitForm({ ...visitForm, purpose: e.target.value })}
          placeholder="定期検診、体調不良など"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">症状</label>
        <textarea
          value={visitForm.symptoms || ""}
          onChange={(e) => setVisitForm({ ...visitForm, symptoms: e.target.value })}
          rows={3}
          placeholder="体調不良、痛みなどの症状を記入"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[88px] touch-manipulation"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">診断結果</label>
        <textarea
          value={visitForm.diagnosis || ""}
          onChange={(e) => setVisitForm({ ...visitForm, diagnosis: e.target.value })}
          rows={3}
          placeholder="医師からの診断や所見を記入"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[88px] touch-manipulation"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">次回受診日</label>
        <input
          type="date"
          value={visitForm.nextVisit || ""}
          onChange={(e) => setVisitForm({ ...visitForm, nextVisit: e.target.value })}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">メモ</label>
        <textarea
          value={visitForm.notes || ""}
          onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
          rows={3}
          placeholder="その他の特記事項や気づいたこと"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[88px] touch-manipulation"
        />
      </div>
    </div>
  );

  const renderTestForm = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">検査日 *</label>
          <input
            type="date"
            value={testForm.date || ""}
            onChange={(e) => setTestForm({ ...testForm, date: e.target.value })}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">検査種類 *</label>
          <input
            type="text"
            value={testForm.testType || ""}
            onChange={(e) => setTestForm({ ...testForm, testType: e.target.value })}
            placeholder="血液検査、超音波検査など"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">検査機関</label>
        <input
          type="text"
          value={testForm.hospitalName || ""}
          onChange={(e) => setTestForm({ ...testForm, hospitalName: e.target.value })}
          placeholder="中央クリニック、検査センターなど"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">検査結果</label>
        <textarea
          value={testForm.results || ""}
          onChange={(e) => setTestForm({ ...testForm, results: e.target.value })}
          rows={4}
          placeholder="検査結果の数値や所見を詳細に記入"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[112px] touch-manipulation"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">基準値</label>
        <textarea
          value={testForm.referenceValues || ""}
          onChange={(e) => setTestForm({ ...testForm, referenceValues: e.target.value })}
          rows={2}
          placeholder="正常範囲や基準値を記入"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[64px] touch-manipulation"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">メモ</label>
        <textarea
          value={testForm.notes || ""}
          onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })}
          rows={3}
          placeholder="検査に関するその他の特記事項"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[88px] touch-manipulation"
        />
      </div>
    </div>
  );

  const renderMedicationForm = () => (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">薬名 *</label>
          <input
            type="text"
            value={medicationForm.name || ""}
            onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
            placeholder="ロキソニン、アスピリンなど"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">処方日 *</label>
          <input
            type="date"
            value={medicationForm.prescribedDate || ""}
            onChange={(e) => setMedicationForm({ ...medicationForm, prescribedDate: e.target.value })}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">用量</label>
          <input
            type="text"
            value={medicationForm.dosage || ""}
            onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
            placeholder="1錠、5mg など"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">服用頻度</label>
          <input
            type="text"
            value={medicationForm.frequency || ""}
            onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
            placeholder="1日3回、食後など"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">服用期間</label>
          <input
            type="text"
            value={medicationForm.duration || ""}
            onChange={(e) => setMedicationForm({ ...medicationForm, duration: e.target.value })}
            placeholder="7日間、継続など"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">処方医</label>
          <input
            type="text"
            value={medicationForm.prescribedBy || ""}
            onChange={(e) => setMedicationForm({ ...medicationForm, prescribedBy: e.target.value })}
            placeholder="田中 太郎 医師"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">処方目的</label>
        <input
          type="text"
          value={medicationForm.purpose || ""}
          onChange={(e) => setMedicationForm({ ...medicationForm, purpose: e.target.value })}
          placeholder="痛み止め、抵抗力向上など"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[44px] touch-manipulation"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">副作用</label>
        <textarea
          value={medicationForm.sideEffects || ""}
          onChange={(e) => setMedicationForm({ ...medicationForm, sideEffects: e.target.value })}
          rows={2}
          placeholder="経験した副作用や注意事項"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[64px] touch-manipulation"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">メモ</label>
        <textarea
          value={medicationForm.notes || ""}
          onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })}
          rows={3}
          placeholder="薬に関するその他の特記事項"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm min-h-[88px] touch-manipulation"
        />
      </div>
    </div>
  );

  const renderRecordsList = () => {
    const { paginatedData, totalPages } = getCurrentPageData();
    const currentPage = getCurrentPage();
    
    switch (activeTab) {
      case "visit": {
        const paginatedVisits = paginatedData as HospitalVisit[];
        return (
          <div className="space-y-4">
            {hospitalVisits.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <p className="text-sm sm:text-base">まだ受診記録がありません</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedVisits
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((visit) => (
                      <div key={visit.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 relative">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center mb-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium mr-2 mb-1 flex-shrink-0 bg-blue-100 text-blue-800">病院受診</span>
                            <h6 className="font-medium text-gray-900 text-sm break-words">{visit.hospitalName}</h6>
                          </div>
                          <div className="space-y-1">
                            {visit.department && <p className="text-xs sm:text-sm text-gray-600">診療科: {visit.department}</p>}
                            {visit.doctorName && <p className="text-xs sm:text-sm text-gray-600">医師: {visit.doctorName}</p>}
                            {visit.purpose && <p className="text-xs sm:text-sm text-gray-600">目的: {visit.purpose}</p>}
                            {visit.diagnosis && (
                              <p className="text-xs sm:text-sm text-gray-700 mt-2 whitespace-pre-wrap break-words leading-relaxed">診断: {visit.diagnosis}</p>
                            )}
                            {visit.nextVisit && <p className="text-xs sm:text-sm text-primary-600 mt-2">次回受診: {formatDate(visit.nextVisit)}</p>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 sm:ml-4">
                          <div className="text-xs text-gray-500 whitespace-nowrap">{formatDate(visit.date)}</div>
                          <div className="hidden sm:flex sm:flex-row sm:mt-2 sm:space-x-1">
                            <button
                              onClick={() => handleEditRecord(visit.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="編集"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(visit.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="削除"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Action Buttons */}
                      <div className="flex justify-end space-x-2 sm:hidden">
                        <button
                          onClick={() => handleEditRecord(visit.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation min-h-[40px]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>編集</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(visit.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation min-h-[40px]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span>削除</span>
                        </button>
                      </div>
                    </div>
                      </div>
                    ))}
                </div>
                {totalPages > 1 && (
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={hospitalVisits.length}
                  />
                )}
              </>
            )}
          </div>
        );
      }

      case "test": {
        const paginatedTests = paginatedData as TestResult[];
        return (
          <div className="space-y-4">
            {testResults.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <p className="text-sm sm:text-base">まだ検査結果がありません</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedTests
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((test) => (
                      <div key={test.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 relative">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center mb-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium mr-2 mb-1 flex-shrink-0 bg-green-100 text-green-800">検査結果</span>
                            <h6 className="font-medium text-gray-900 text-sm break-words">{test.testType}</h6>
                          </div>
                          <div className="space-y-1">
                            {test.hospitalName && <p className="text-xs sm:text-sm text-gray-600">検査機関: {test.hospitalName}</p>}
                            {test.results && (
                              <p className="text-xs sm:text-sm text-gray-700 mt-2 whitespace-pre-wrap break-words leading-relaxed">結果: {test.results}</p>
                            )}
                            {test.referenceValues && <p className="text-xs sm:text-sm text-gray-600">基準値: {test.referenceValues}</p>}
                            {test.notes && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words leading-relaxed">メモ: {test.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 sm:ml-4">
                          <div className="text-xs text-gray-500 whitespace-nowrap">{formatDate(test.date)}</div>
                          <div className="hidden sm:flex sm:flex-row sm:mt-2 sm:space-x-1">
                            <button
                              onClick={() => handleEditRecord(test.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="編集"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(test.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="削除"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Action Buttons */}
                      <div className="flex justify-end space-x-2 sm:hidden">
                        <button
                          onClick={() => handleEditRecord(test.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation min-h-[40px]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>編集</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(test.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation min-h-[40px]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span>削除</span>
                        </button>
                      </div>
                    </div>
                      </div>
                    ))}
                </div>
                {totalPages > 1 && (
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={testResults.length}
                  />
                )}
              </>
            )}
          </div>
        );
      }

      case "medication": {
        const paginatedMedications = paginatedData as Medication[];
        return (
          <div className="space-y-4">
            {medications.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <p className="text-sm sm:text-base">まだ処方薬情報がありません</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedMedications
                    .sort((a, b) => new Date(b.prescribedDate).getTime() - new Date(a.prescribedDate).getTime())
                    .map((medication) => (
                      <div key={medication.id} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 relative">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center mb-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium mr-2 mb-1 flex-shrink-0 bg-purple-100 text-purple-800">処方薬</span>
                            <h6 className="font-medium text-sm break-words text-gray-900">{medication.name}</h6>
                          </div>
                          <div className="space-y-1">
                            {medication.dosage && <p className="text-xs sm:text-sm text-gray-600">用量: {medication.dosage}</p>}
                            {medication.frequency && <p className="text-xs sm:text-sm text-gray-600">頻度: {medication.frequency}</p>}
                            {medication.duration && <p className="text-xs sm:text-sm text-gray-600">期間: {medication.duration}</p>}
                            {medication.purpose && (
                              <p className="text-xs sm:text-sm text-gray-700 mt-2 whitespace-pre-wrap break-words leading-relaxed">
                                目的: {medication.purpose}
                              </p>
                            )}
                            {medication.prescribedBy && <p className="text-xs sm:text-sm text-gray-600">処方医: {medication.prescribedBy}</p>}
                            {medication.sideEffects && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words leading-relaxed">
                                副作用: {medication.sideEffects}
                              </p>
                            )}
                            {medication.notes && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words leading-relaxed">メモ: {medication.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 sm:ml-4">
                          <div className="text-xs text-gray-500 whitespace-nowrap">{formatDate(medication.prescribedDate)}</div>
                          <div className="hidden sm:flex sm:flex-row sm:mt-2 sm:space-x-1">
                            <button
                              onClick={() => handleEditRecord(medication.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="編集"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(medication.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="削除"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Action Buttons */}
                      <div className="flex justify-end space-x-2 sm:hidden">
                        <button
                          onClick={() => handleEditRecord(medication.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation min-h-[40px]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>編集</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(medication.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation min-h-[40px]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span>削除</span>
                        </button>
                      </div>
                    </div>
                      </div>
                    ))}
                </div>
                {totalPages > 1 && (
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={medications.length}
                  />
                )}
              </>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">診断記録</h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 px-2 sm:px-0">病院受診、検査結果、処方薬の情報を記録・管理</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as RecordType);
                setShowAddForm(false);
                setEditingRecord(null);
              }}
              className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                activeTab === tab.id ? "bg-white text-primary-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-xs sm:text-sm whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 text-center sm:text-left">{tabs.find((t) => t.id === activeTab)?.label}記録</h3>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingRecord(null);
                // Clear forms
                setVisitForm({});
                setTestForm({});
                setMedicationForm({});
              }}
              className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg text-sm transition-colors min-h-[44px] touch-manipulation"
            >
              {showAddForm ? "キャンセル" : "新規追加"}
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4 text-center sm:text-left">
                {editingRecord ? "記録を編集" : "新しい記録を追加"}
              </h4>

              {activeTab === "visit" && renderVisitForm()}
              {activeTab === "test" && renderTestForm()}
              {activeTab === "medication" && renderMedicationForm()}

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingRecord(null);
                    setVisitForm({});
                    setTestForm({});
                    setMedicationForm({});
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 active:text-gray-900 text-sm min-h-[44px] touch-manipulation"
                >
                  キャンセル
                </button>
                <button
                  onClick={editingRecord ? handleUpdateRecord : handleAddRecord}
                  className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg text-sm transition-colors min-h-[44px] touch-manipulation"
                >
                  {editingRecord ? "更新" : "保存"}
                </button>
              </div>
            </div>
          )}

          {/* Records List */}
          {renderRecordsList()}
        </div>
      </div>
    </div>
  );
};
