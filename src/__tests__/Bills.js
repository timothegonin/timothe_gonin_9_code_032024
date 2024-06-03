/**
 * @jest-environment jsdom
 */

import {getAllByTestId, getByRole, getByTestId, screen, waitFor} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
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
      //to-do write expect expression (OK)
      expect(windowIcon.classList).toContain('active-icon')
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  describe("When I am on Bills page and clicking on 'New bill' button" , () => {
    test("Then, the 'New Bill' form should render and the URL should update on button click", () => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      const button = screen.getByTestId('btn-new-bill')
      
      expect(getByTestId(document.body, 'btn-new-bill')).toBeTruthy()
      userEvent.click(button)

      expect(getByTestId(document.body, 'form-new-bill')).toBeTruthy()
      expect(window.location.hash).toEqual(ROUTES_PATH.NewBill);
    })
  })
  describe("When I click on the eye icon of a bill", () => {
    test("Then, the modal displaying the bill details should appear with the correct image source",() => {
      document.body.innerHTML = BillsUI({ data: bills })
      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        bills,
        localStorage: window.localStorage,
      });

      const modal = document.querySelector('#modaleFile')

      $.fn.modal = jest.fn(() => {
        modal.classList.add("show");
      });
      
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleClickIconEye = jest.fn(() => {
        bill.handleClickIconEye(iconEye);
      });
      
      iconEye.addEventListener('click', handleClickIconEye)
      userEvent.click(iconEye)
      
      const billUrl = iconEye.getAttribute('data-bill-url');
      const img = modal.querySelector('img');
      
      expect(handleClickIconEye).toHaveBeenCalled()      
      expect(modal.classList.contains('show')).toBeTruthy()
      expect(img.getAttribute('src')).toEqual(billUrl);
    })
  })
})

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", ()=> {
    test("fetches bills that have already been transmitted and are displayed", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const billsList = await screen.getByTestId('tbody')
      expect(billsList).toBeTruthy()
      expect(billsList.children.length).toEqual(4)
    })
  })
  describe("When an error occurus on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Dashboard)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
  })
})
