import React, { useState, useEffect } from "react";

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

  // Form states
  const [visitForm, setVisitForm] = useState<Partial<HospitalVisit>>({});
  const [testForm, setTestForm] = useState<Partial<TestResult>>({});
  const [medicationForm, setMedicationForm] = useState<Partial<Medication>>({});

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const savedVisits = localStorage.getItem("hospitalVisits");
    const savedTests = localStorage.getItem("testResults");
    const savedMedications = localStorage.getItem("medications");

    if (savedVisits) setHospitalVisits(JSON.parse(savedVisits));
    if (savedTests) setTestResults(JSON.parse(savedTests));
    if (savedMedications) setMedications(JSON.parse(savedMedications));
  };

  const saveToStorage = (type: RecordType, data: any[]) => {
    switch (type) {
      case "visit":
        localStorage.setItem("hospitalVisits", JSON.stringify(data));
        setHospitalVisits(data);
        break;
      case "test":
        localStorage.setItem("testResults", JSON.stringify(data));
        setTestResults(data);
        break;
      case "medication":
        localStorage.setItem("medications", JSON.stringify(data));
        setMedications(data);
        break;
    }
  };

  const handleAddRecord = () => {
    const newId = Date.now().toString();
    
    switch (activeTab) {
      case "visit":
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

      case "test":
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

      case "medication":
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
    
    setShowAddForm(false);
  };

  const handleEditRecord = (id: string) => {
    setEditingRecord(id);
    switch (activeTab) {
      case "visit":
        const visit = hospitalVisits.find(v => v.id === id);
        if (visit) setVisitForm(visit);
        break;
      case "test":
        const test = testResults.find(t => t.id === id);
        if (test) setTestForm(test);
        break;
      case "medication":
        const medication = medications.find(m => m.id === id);
        if (medication) setMedicationForm(medication);
        break;
    }
    setShowAddForm(true);
  };

  const handleUpdateRecord = () => {
    if (!editingRecord) return;

    switch (activeTab) {
      case "visit":
        const updatedVisits = hospitalVisits.map(v => 
          v.id === editingRecord ? { ...v, ...visitForm } : v
        );
        saveToStorage("visit", updatedVisits);
        setVisitForm({});
        break;

      case "test":
        const updatedTests = testResults.map(t => 
          t.id === editingRecord ? { ...t, ...testForm } : t
        );
        saveToStorage("test", updatedTests);
        setTestForm({});
        break;

      case "medication":
        const updatedMedications = medications.map(m => 
          m.id === editingRecord ? { ...m, ...medicationForm } : m
        );
        saveToStorage("medication", updatedMedications);
        setMedicationForm({});
        break;
    }
    
    setEditingRecord(null);
    setShowAddForm(false);
  };

  const handleDeleteRecord = (id: string) => {
    if (!confirm("この記録を削除しますか？")) return;

    switch (activeTab) {
      case "visit":
        saveToStorage("visit", hospitalVisits.filter(v => v.id !== id));
        break;
      case "test":
        saveToStorage("test", testResults.filter(t => t.id !== id));
        break;
      case "medication":
        saveToStorage("medication", medications.filter(m => m.id !== id));
        break;
    }
  };

  const toggleMedicationStatus = (id: string) => {
    const updatedMedications = medications.map(m => 
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    saveToStorage("medication", updatedMedications);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  const tabs = [
    { id: "visit", label: "病院受診", icon: "🏥" },
    { id: "test", label: "検査結果", icon: "🔬" },
    { id: "medication", label: "処方薬", icon: "💊" },
  ];

  const renderVisitForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">受診日 *</label>
          <input
            type="date"
            value={visitForm.date || ""}
            onChange={(e) => setVisitForm({...visitForm, date: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">病院名 *</label>
          <input
            type="text"
            value={visitForm.hospitalName || ""}
            onChange={(e) => setVisitForm({...visitForm, hospitalName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">医師名</label>
          <input
            type="text"
            value={visitForm.doctorName || ""}
            onChange={(e) => setVisitForm({...visitForm, doctorName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">診療科</label>
          <input
            type="text"
            value={visitForm.department || ""}
            onChange={(e) => setVisitForm({...visitForm, department: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">受診目的</label>
        <input
          type="text"
          value={visitForm.purpose || ""}
          onChange={(e) => setVisitForm({...visitForm, purpose: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">症状</label>
        <textarea
          value={visitForm.symptoms || ""}
          onChange={(e) => setVisitForm({...visitForm, symptoms: e.target.value})}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">診断結果</label>
        <textarea
          value={visitForm.diagnosis || ""}
          onChange={(e) => setVisitForm({...visitForm, diagnosis: e.target.value})}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">次回受診日</label>
        <input
          type="date"
          value={visitForm.nextVisit || ""}
          onChange={(e) => setVisitForm({...visitForm, nextVisit: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
        <textarea
          value={visitForm.notes || ""}
          onChange={(e) => setVisitForm({...visitForm, notes: e.target.value})}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );

  const renderTestForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">検査日 *</label>
          <input
            type="date"
            value={testForm.date || ""}
            onChange={(e) => setTestForm({...testForm, date: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">検査種類 *</label>
          <input
            type="text"
            value={testForm.testType || ""}
            onChange={(e) => setTestForm({...testForm, testType: e.target.value})}
            placeholder="血液検査、超音波検査など"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">検査機関</label>
        <input
          type="text"
          value={testForm.hospitalName || ""}
          onChange={(e) => setTestForm({...testForm, hospitalName: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">検査結果</label>
        <textarea
          value={testForm.results || ""}
          onChange={(e) => setTestForm({...testForm, results: e.target.value})}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">基準値</label>
        <textarea
          value={testForm.referenceValues || ""}
          onChange={(e) => setTestForm({...testForm, referenceValues: e.target.value})}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
        <textarea
          value={testForm.notes || ""}
          onChange={(e) => setTestForm({...testForm, notes: e.target.value})}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );

  const renderMedicationForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">薬名 *</label>
          <input
            type="text"
            value={medicationForm.name || ""}
            onChange={(e) => setMedicationForm({...medicationForm, name: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">処方日 *</label>
          <input
            type="date"
            value={medicationForm.prescribedDate || ""}
            onChange={(e) => setMedicationForm({...medicationForm, prescribedDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">用量</label>
          <input
            type="text"
            value={medicationForm.dosage || ""}
            onChange={(e) => setMedicationForm({...medicationForm, dosage: e.target.value})}
            placeholder="1錠、5mg など"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">服用頻度</label>
          <input
            type="text"
            value={medicationForm.frequency || ""}
            onChange={(e) => setMedicationForm({...medicationForm, frequency: e.target.value})}
            placeholder="1日3回、食後など"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">服用期間</label>
          <input
            type="text"
            value={medicationForm.duration || ""}
            onChange={(e) => setMedicationForm({...medicationForm, duration: e.target.value})}
            placeholder="7日間、継続など"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">処方医</label>
          <input
            type="text"
            value={medicationForm.prescribedBy || ""}
            onChange={(e) => setMedicationForm({...medicationForm, prescribedBy: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">処方目的</label>
        <input
          type="text"
          value={medicationForm.purpose || ""}
          onChange={(e) => setMedicationForm({...medicationForm, purpose: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">副作用</label>
        <textarea
          value={medicationForm.sideEffects || ""}
          onChange={(e) => setMedicationForm({...medicationForm, sideEffects: e.target.value})}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
        <textarea
          value={medicationForm.notes || ""}
          onChange={(e) => setMedicationForm({...medicationForm, notes: e.target.value})}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );

  const renderRecordsList = () => {
    switch (activeTab) {
      case "visit":
        return (
          <div className="space-y-4">
            {hospitalVisits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🏥</div>
                <p>まだ受診記録がありません</p>
              </div>
            ) : (
              hospitalVisits
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((visit) => (
                  <div key={visit.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{visit.hospitalName}</h4>
                          <span className="text-sm text-gray-500">{formatDate(visit.date)}</span>
                        </div>
                        {visit.department && <p className="text-sm text-gray-600">診療科: {visit.department}</p>}
                        {visit.doctorName && <p className="text-sm text-gray-600">医師: {visit.doctorName}</p>}
                        {visit.purpose && <p className="text-sm text-gray-600">目的: {visit.purpose}</p>}
                        {visit.diagnosis && <p className="text-sm text-gray-700 mt-2">診断: {visit.diagnosis}</p>}
                        {visit.nextVisit && (
                          <p className="text-sm text-primary-600 mt-2">次回受診: {formatDate(visit.nextVisit)}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditRecord(visit.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(visit.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        );

      case "test":
        return (
          <div className="space-y-4">
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔬</div>
                <p>まだ検査結果がありません</p>
              </div>
            ) : (
              testResults
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((test) => (
                  <div key={test.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{test.testType}</h4>
                          <span className="text-sm text-gray-500">{formatDate(test.date)}</span>
                        </div>
                        {test.hospitalName && <p className="text-sm text-gray-600">検査機関: {test.hospitalName}</p>}
                        {test.results && <p className="text-sm text-gray-700 mt-2">結果: {test.results}</p>}
                        {test.referenceValues && <p className="text-sm text-gray-600">基準値: {test.referenceValues}</p>}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditRecord(test.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(test.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        );

      case "medication":
        return (
          <div className="space-y-4">
            {medications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💊</div>
                <p>まだ処方薬情報がありません</p>
              </div>
            ) : (
              medications
                .sort((a, b) => new Date(b.prescribedDate).getTime() - new Date(a.prescribedDate).getTime())
                .map((medication) => (
                  <div key={medication.id} className={`border border-gray-200 rounded-lg p-4 ${
                    medication.isActive ? "bg-white" : "bg-gray-50"
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className={`font-medium ${medication.isActive ? "text-gray-900" : "text-gray-500"}`}>
                            {medication.name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            medication.isActive 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {medication.isActive ? "服用中" : "終了"}
                          </span>
                          <span className="text-sm text-gray-500">{formatDate(medication.prescribedDate)}</span>
                        </div>
                        {medication.dosage && <p className="text-sm text-gray-600">用量: {medication.dosage}</p>}
                        {medication.frequency && <p className="text-sm text-gray-600">頻度: {medication.frequency}</p>}
                        {medication.duration && <p className="text-sm text-gray-600">期間: {medication.duration}</p>}
                        {medication.purpose && <p className="text-sm text-gray-700 mt-2">目的: {medication.purpose}</p>}
                        {medication.prescribedBy && <p className="text-sm text-gray-600">処方医: {medication.prescribedBy}</p>}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleMedicationStatus(medication.id)}
                          className={`text-sm ${
                            medication.isActive 
                              ? "text-orange-600 hover:text-orange-800" 
                              : "text-green-600 hover:text-green-800"
                          }`}
                        >
                          {medication.isActive ? "終了" : "再開"}
                        </button>
                        <button
                          onClick={() => handleEditRecord(medication.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(medication.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">診断記録</h2>
            <p className="text-sm text-neutral-600 mt-1">
              病院受診、検査結果、処方薬の情報を記録・管理
            </p>
          </div>
          <span className="text-2xl">📋</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as RecordType);
                setShowAddForm(false);
                setEditingRecord(null);
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-primary-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label}記録
            </h3>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingRecord(null);
                // Clear forms
                setVisitForm({});
                setTestForm({});
                setMedicationForm({});
              }}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors"
            >
              {showAddForm ? "キャンセル" : "新規追加"}
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {editingRecord ? "記録を編集" : "新しい記録を追加"}
              </h4>
              
              {activeTab === "visit" && renderVisitForm()}
              {activeTab === "test" && renderTestForm()}
              {activeTab === "medication" && renderMedicationForm()}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingRecord(null);
                    setVisitForm({});
                    setTestForm({});
                    setMedicationForm({});
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  キャンセル
                </button>
                <button
                  onClick={editingRecord ? handleUpdateRecord : handleAddRecord}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors"
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

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-amber-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm">
            <p className="font-medium text-amber-800">記録管理のポイント</p>
            <ul className="mt-1 text-amber-700 list-disc list-inside space-y-1">
              <li>定期的に記録を更新して最新の状態を保ちましょう</li>
              <li>検査結果は数値だけでなく医師のコメントも記録しましょう</li>
              <li>薬の副作用や効果も記録しておくと次回の受診に役立ちます</li>
              <li>重要な情報は医師と共有し、適切な治療を受けましょう</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};