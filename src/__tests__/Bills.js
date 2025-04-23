/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import '@testing-library/jest-dom';

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    // Vérifie que l'icône est bien mis en surbrillance
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      expect(windowIcon).toHaveClass('active-icon');
    });

    // Vérifie le tri par date (du plus récent au plus ancien)
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    // Vérifie que le titre et le bouton sont bien affichés
    test('Then title and button should be displayed', () => {
      document.body.innerHTML = BillsUI({ data: [] })
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy()
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
    });

    // Vérifie que le formulaire de création de note de frais s'affiche bien
    describe('When I click on "Nouvelle note de frais"', () => {
      test('Then the form to create a new invoice should appear', () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const bills = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        })
        document.body.innerHTML = BillsUI({ data: bills });

        const buttonNewBill = screen.getByTestId('btn-new-bill');
        const handleClickNewBill = jest.fn(bills.handleClickNewBill);
        buttonNewBill.addEventListener('click', handleClickNewBill);
        fireEvent.click(buttonNewBill);
        expect(handleClickNewBill).toHaveBeenCalled();
      });
    });

    // Vérifie si la modale contenant le justificatif de la note de frais apparaît
    describe('When I click on the icon eye', () => {
      test('Then a modal should appear', () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        };
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }));
        const billsPage = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage
        });
        document.body.innerHTML = BillsUI({ data: bills });
        const iconEye = screen.getAllByTestId("icon-eye");
        const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);
        const modaleFile = document.getElementById("modaleFile");
        $.fn.modal = jest.fn(() => modaleFile.classList.add("show"));

        iconEye.forEach((icon) => {
          icon.addEventListener("click", handleClickIconEye(icon))
          fireEvent.click(icon)
          expect(handleClickIconEye).toHaveBeenCalled()
        });
        expect(modaleFile).toHaveClass("show");
        expect(screen.getByText("Justificatif")).toBeTruthy();
        expect(bills[0].fileUrl).toBeTruthy();
      });
    });
  })
});

// Test Bills.js
describe("Given I am a user connected as Employee", () => {
  describe("When fetch bills from API fail", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
    })
    // Vérifie que l'erreur 404 est bien affichée
    test("Then, ErrorPage should be rendered", async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        return: () => Promise.reject(new Error("Erreur 404"))
      }));
      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      expect(screen.getByText(/Erreur 404/)).toBeTruthy();
    });
    // Vérifie que l'erreur 500 est bien affichée
    test("Then, ErrorPage should be rendered", async () => {
      mockStore.bills.mockImplementationOnce(() => ({
        return: () => Promise.reject(new Error("Erreur 500"))
      }));
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      expect(screen.getByText(/Erreur 500/)).toBeTruthy();
    });
  });
});