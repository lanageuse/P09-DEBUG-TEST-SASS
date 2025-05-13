/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import { ROUTES } from "../constants/routes.js";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page", () => {
        beforeEach(() => {
            Object.defineProperty(window, 'localStorage', { value: localStorageMock });
            window.localStorage.setItem('user', JSON.stringify({
                type: 'Employee'
            }));
            document.body.innerHTML = NewBillUI();
        })
        // Vérifie que le fichier est bien ajouté si le format est valide
        test("Then the handleChangeFile() function is called when a file is added and file format is valid", () => {
            const newBill = new NewBill({ document, onNavigate: {}, store: mockStore, localStorage: {} });
            const handleChange = jest.fn((e) => newBill.handleChangeFile(e));
            const inputFile = screen.getByTestId('file');
            inputFile.addEventListener('change', handleChange);
            fireEvent.change(inputFile, {
                target: {
                    files: [new File(['test'], 'test.png', { type: 'image/png' })]
                }
            });
            expect(handleChange).toHaveBeenCalled();
            expect(inputFile.files[0].name).toBe('test.png');
        });
        // Vérifie que le message d'erreur est affiché lorsque le format n'est pas valide
        test("Then it should show error message if file format is invalid", () => {
            const newBill = new NewBill({ document, onNavigate: {}, store: mockStore, localStorage: {} });
            const handleChange = jest.fn((e) => newBill.handleChangeFile(e));
            const inputFile = screen.getByTestId('file');
            const erroMessage = screen.getByTestId('error-message')
            inputFile.addEventListener('change', handleChange);
            fireEvent.change(inputFile, {
                target: {
                    files: [new File(['test'], 'test.png', { type: 'image/gif' })]
                }
            });
            expect(handleChange).toHaveBeenCalled();
            expect(inputFile.value).toBe('');
            expect(erroMessage.textContent).toBe("Format de fichier invalide. Seuls les fichiers JPG, JPEG ou PNG sont autorisés.")
        });
        // Test intégration POST 
        // Vérifie que la nouvelle note de frais peut être envoyée
        describe('When I am on NewBill Page, i fill the form and i click submit', () => {
            test("Then the bill is added and I am redirected to the bills page", () => {
                const onNavigate = (pathname) => {
                    document.body.innerHTML = ROUTES({ pathname })
                };
                const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: {} });
                // Simuler les informations du formulaire
                const typeInput = screen.getByTestId('expense-type');
                const nameInput = screen.getByTestId('expense-name');
                const amountInput = screen.getByTestId('amount');
                const dateInput = screen.getByTestId('datepicker');
                const vatInput = screen.getByTestId('vat');
                const pctInput = screen.getByTestId('pct');
                const commentaryInput = screen.getByTestId('commentary');
                const file = screen.getByTestId("file");

                fireEvent.change(typeInput, { target: { value: 'RDZ LES ALOUETTES DE MONTREAL' } });
                fireEvent.change(nameInput, { target: { value: 'Vol Montreal' } });
                fireEvent.change(amountInput, { target: { value: '378' } });
                fireEvent.change(dateInput, { target: { value: '2025-05-23' } });
                fireEvent.change(vatInput, { target: { value: '120' } });
                fireEvent.change(pctInput, { target: { value: '20' } });
                fireEvent.change(commentaryInput, { target: { value: 'RDZ prise de contact et présentation du projet' } });
                fireEvent.change(file, { target: { files: [new File(["test"], "test.jpg", { type: "image/jpg" })] } });

                const newBillForm = screen.getByTestId("form-new-bill");
                const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
                newBillForm.addEventListener("submit", handleSubmit);
                fireEvent.submit(newBillForm);
                expect(handleSubmit).toHaveBeenCalled();
            });
        })
    });
});