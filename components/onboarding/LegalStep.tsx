'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface LegalStepProps {
    initialData?: Record<string, string | boolean>
    onComplete: () => void
    onBack: () => void
}

export function LegalStep({ initialData, onComplete, onBack }: LegalStepProps) {
    const [loading, setLoading] = useState(false)
    const [accepted, setAccepted] = useState(Boolean(initialData?.contract_signed) || false)
    const [signatureText, setSignatureText] = useState('')
    const [agreed, setAgreed] = useState(false)

    // Validate form state
    useEffect(() => {
        if (agreed && signatureText.trim().length > 2) {
            setAccepted(true)
        } else {
            setAccepted(false)
        }
    }, [agreed, signatureText])

    const containerRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    async function handleSubmit() {
        if (!accepted) {
            toast.error('Please accept the agreement and sign with your full name.')
            return
        }

        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user found')

            // Generate PDF
            const element = containerRef.current
            if (!element) throw new Error('Contract element not found')

            // Capture the specific contract content
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff', // Force white background on the canvas logic
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('legal-contract-content')
                    if (clonedElement) {
                        // Force standard colors to avoid 'oklab' error from Tailwind/Browser
                        clonedElement.style.backgroundColor = '#ffffff'
                        clonedElement.style.color = '#000000'
                        clonedElement.style.borderColor = '#e2e8f0'
                    }

                    // Inject Signature Text and Date inline
                    const sigPlaceholder = clonedDoc.getElementById('contract-signature-placeholder')
                    if (sigPlaceholder) {
                        // Replace placeholder with text signature
                        sigPlaceholder.innerText = signatureText
                        // Style it to look like a signature
                        sigPlaceholder.style.fontFamily = '"Brush Script MT", "Zapfino", "Segoe Script", cursive'
                        sigPlaceholder.style.fontSize = '24px'
                        sigPlaceholder.style.fontStyle = 'italic'
                        sigPlaceholder.style.borderBottom = 'none'
                        sigPlaceholder.style.padding = '0 10px'
                    }

                    const datePlaceholder = clonedDoc.getElementById('contract-date-placeholder')
                    if (datePlaceholder) {
                        datePlaceholder.innerText = new Date().toLocaleDateString()
                    }
                }
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const imgProps = pdf.getImageProperties(imgData)
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

            const pdfBlob = pdf.output('blob')

            // Upload to Supabase Storage
            const fileName = `${user.id}/${Date.now()}_contract.pdf`
            const { error: uploadError } = await supabase.storage
                .from('contracts')
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                })

            if (uploadError) throw uploadError

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('contracts')
                .getPublicUrl(fileName)

            const { error } = await supabase
                .from('profiles')
                .update({
                    contract_signed: true,
                    signed_at: new Date().toISOString(),
                    contract_url: publicUrl,
                    onboarding_status: 'completed',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)

            if (error) throw error

            toast.success('Contract signed and saved successfully')
            onComplete()
        } catch (error: unknown) {
            console.error(error)
            toast.error('Error signing contract: ' + (error as Error).message)
        } finally {
            setLoading(false)
        }
    }

    // BLOCKING: If no salary is assigned, do not show contract
    if (!initialData?.salary || initialData.salary === '0' || initialData.salary === '') {
        return (
            <Card className="shadow-lg border-yellow-500/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-500">
                        <FileText className="h-5 w-5" />
                        Contract Preparation Pending
                    </CardTitle>
                    <CardDescription>
                        Your employment contract is currently being generated.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20 text-yellow-200">
                        <p className="font-medium">Salary Configuration Required</p>
                        <p className="text-sm mt-1 opacity-90">
                            Your administrator has not assigned a salary to your profile yet.
                            Please contact your hiring manager or administrator to finalize your offer details.
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Once your salary is configured, you will be able to review and sign your contract here.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={onBack}>
                        Back
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Legal Agreement</CardTitle>
                <CardDescription>
                    Please review and accept the Solvenza Solutions contractor agreement.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div id="legal-contract-content" ref={containerRef} className="border border-border rounded-md p-8 bg-white text-black h-96 overflow-y-auto font-serif text-sm leading-relaxed shadow-inner mb-6">
                    <div className="text-center mb-6">
                        <h2 className="font-bold text-lg uppercase underline mb-2">Independent Contractor Service Agreement</h2>
                        <p className="font-bold">Solvenza Solutions LLC</p>
                        <p>30 N Gould St Ste N, Sheridan, WY 82801</p>
                        <p>+1 307 275 933</p>
                    </div>

                    <p className="mb-4"><strong>BETWEEN:</strong></p>
                    <p className="mb-4 text-justify">
                        <strong>Solvenza Solutions LLC</strong>, a Wyoming limited liability company, with principal place of business at 30 N Gould St Ste N, Sheridan, WY 82801, United States, represented by Laura Lechuga (hereinafter, &quot;THE COMPANY&quot;), and <strong className="uppercase">{initialData?.full_name || '________________________'}</strong>, of legal age, identified with ID No. <strong>{initialData?.government_id || '________________________'}</strong>, residing in <strong>{initialData?.country || '________________________'}</strong>, acting in his/her own name and as an independent contractor (hereinafter, &quot;THE CONTRACTOR&quot;), the parties agree as follows:
                    </p>

                    <p className="mb-2"><strong>1. SERVICES</strong></p>
                    <p className="mb-4 text-justify">
                        THE CONTRACTOR shall provide Virtual Assistant services in accordance with the tasks, guidelines, and objectives established by THE COMPANY’s client, exercising full autonomy over methods and work schedule. This Agreement governs an independent service arrangement and does not create an employment relationship nor an indefinite-term contract.
                    </p>

                    <p className="mb-2"><strong>2. MODE AND PLACE OF PERFORMANCE</strong></p>
                    <p className="mb-4 text-justify">
                        All services shall be performed remotely, using THE CONTRACTOR’s own hardware, software, and internet connectivity.
                    </p>

                    <p className="mb-2"><strong>3. TERM AND TERMINATION</strong></p>
                    <p className="mb-2 text-justify">
                        3.1 This Agreement commences on the date of signature and remains in effect as long as THE CONTRACTOR is actively providing services.
                    </p>
                    <p className="mb-4 text-justify">
                        3.2 Either party may terminate this Agreement immediately, without compensation or advance notice, by written or electronic notice to the other party.
                    </p>

                    <p className="mb-2"><strong>4. STATUTE OF FRAUDS & ELECTRONIC SIGNATURE</strong></p>
                    <p className="mb-2 text-justify">
                        4.1 Pursuant to Wyoming’s Statute of Frauds (W.S. 1-23-105), agreements not capable of performance within twelve (12) months must be in writing to be enforceable. Because this Agreement has no fixed term—and could extend beyond one year unless terminated by either party—both parties agree that its validity and enforceability depend upon its written form and electronic execution.
                    </p>
                    <p className="mb-2 text-justify">
                        4.2 Notwithstanding the foregoing, nothing in this Clause limits either party’s right to terminate immediately under Clause 3.
                    </p>
                    <p className="mb-4 text-justify">
                        4.3 Electronic signatures provided through certified platforms (e.g., DocuSign, PandaDoc, or similar) or any scanned or digital signature affixed to this document shall have the same legal effect as a handwritten signature.
                    </p>

                    <p className="mb-2"><strong>5. FEES AND PAYMENT</strong></p>
                    <p className="mb-2 text-justify">
                        5.1 THE COMPANY shall pay THE CONTRACTOR <strong>USD {initialData?.salary ? Number(initialData.salary).toFixed(2) : '_____'}</strong> per month, in two equal installments of <strong>USD {initialData?.salary ? (Number(initialData.salary) / 2).toFixed(2) : '_____'}</strong> each, payable bi-weekly.
                    </p>
                    <p className="mb-4 text-justify">
                        5.2 Payments will be made by electronic funds transfer, upon receipt of a valid electronic invoice or equivalent legal document.
                    </p>

                    <p className="mb-2"><strong>6. TAXES AND FISCAL OBLIGATIONS</strong></p>
                    <p className="mb-4 text-justify">
                        THE CONTRACTOR shall be solely responsible for all income taxes, social security, and other fiscal contributions in his/her country of residence. THE COMPANY will not withhold or contribute to any such obligations.
                    </p>

                    <p className="mb-2"><strong>7. PERFORMANCE AND EVALUATION</strong></p>
                    <p className="mb-4 text-justify">
                        The continuation of this Agreement shall be subject to periodic performance evaluations based on metrics defined by THE COMPANY’s client. Repeated failure to meet agreed objectives may result in immediate termination.
                    </p>

                    <p className="mb-2"><strong>8. BONUSES AND HOLIDAYS</strong></p>
                    <p className="mb-2 text-justify">
                        8.1 Any bonus or incentive shall be granted at the sole discretion of THE COMPANY’s client and based on THE CONTRACTOR’s performance.
                    </p>
                    <p className="mb-4 text-justify">
                        8.2 Holidays shall be observed in accordance with the client’s policy, applicable both to THE CONTRACTOR’s country of residence and to the United States.
                    </p>

                    <p className="mb-2"><strong>9. NATURE OF RELATIONSHIP</strong></p>
                    <p className="mb-4 text-justify">
                        This is an independent contractor agreement. Nothing herein shall be construed to create an employment relationship, entitlement to benefits, seniority, or any other rights associated with an employer-employee relationship.
                    </p>

                    <p className="mb-2"><strong>10. CONFIDENTIALITY</strong></p>
                    <p className="mb-2 text-justify">
                        10.1 THE CONTRACTOR shall maintain strict confidentiality of all proprietary or confidential information of THE COMPANY and/or its client during the term of this Agreement and for five (5) years thereafter.
                    </p>
                    <p className="mb-4 text-justify">
                        10.2 Upon termination, THE CONTRACTOR shall return or destroy, as directed by THE COMPANY, all documents and materials containing such information.
                    </p>

                    <p className="mb-2"><strong>11. GOVERNING LAW AND JURISDICTION</strong></p>
                    <p className="mb-2 text-justify">
                        11.1 This Agreement shall be governed by and construed in accordance with the laws of the State of Wyoming, United States.
                    </p>
                    <p className="mb-4 text-justify">
                        11.2 Any dispute arising under or relating to this Agreement shall be subject to the exclusive jurisdiction of the state and federal courts located in Wyoming.
                    </p>

                    <p className="mb-4"><strong>12. ENTIRE AGREEMENT</strong></p>
                    <p className="mb-8 text-justify">
                        This document constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior or contemporaneous understandings, whether written or oral.
                    </p>

                    <div className="mb-8">
                        <p className="mb-4">IN WITNESS WHEREOF, the parties have executed this Agreement in two counterparts, each of which shall be deemed an original.</p>

                        <div className="grid grid-cols-2 gap-8 mt-8">
                            <div>
                                <p className="font-bold">FOR THE COMPANY</p>
                                <p>Solvenza Solutions LLC</p>
                                <p className="mb-8">Laura Lechuga, Authorized Representative</p>
                                <p>Signature: __________________________</p>
                                <p>Date: ________________________________</p>
                            </div>
                            <div>
                                <p className="font-bold">FOR THE CONTRACTOR</p>
                                <p className="mb-8">Name: {initialData?.full_name || '________________________'}</p>
                                <p>Signature: <span id="contract-signature-placeholder">__________________________</span></p>
                                <p>Date: <span id="contract-date-placeholder">________________________________</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-6 max-w-lg mx-auto bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="flex items-start space-x-3">
                        <div className="flex items-center h-5">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                            />
                        </div>
                        <div className="text-sm">
                            <label htmlFor="terms" className="font-medium text-foreground cursor-pointer select-none">
                                I agree to the terms and conditions used in this Service Agreement.
                            </label>
                            <p className="text-muted-foreground mt-1 text-xs">
                                By checking this box, you acknowledge that you have read, understood, and accept the legal agreement key terms above.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="signature" className="block text-sm font-medium text-foreground mb-2">
                            Digital Signature (Type Full Name)
                        </label>
                        <input
                            id="signature"
                            type="text"
                            value={signatureText}
                            onChange={(e) => setSignatureText(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Entering your full name here constitutes your electronic signature and intent to be bound by this agreement.
                        </p>
                    </div>
                </div>

            </CardContent>
            <CardFooter className="flex justify-between pt-0 mt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                >
                    Back
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!accepted || loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
                >
                    {loading ? 'Processing...' : 'Sign Agreement & Complete'}
                </Button>
            </CardFooter>
        </Card>
    )
}
