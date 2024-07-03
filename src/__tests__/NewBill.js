/**
 * @jest-environment jsdom
 */

import { fireEvent, screen , waitFor} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH} from "../constants/routes.js";
import router from "../app/Router.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"


describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.NewBill)
    const html = NewBillUI()
    document.body.innerHTML = html
  })
  describe("When I am on NewBill Page", () => {
    test("Then the form elements should be present", () => {
      //to-do write assertion
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
    })
  })
  describe('When I try to submit a new bill', () => {
    test("Then a wrongly formatted file will return an error and reset the file entry",  () => {
      const newBill = new NewBill({
        document, onNavigate, store: mockStore,localStorage: window.localStorage
      })

      const file = new File(["foo"], "foo.txt", {
        type: "text/plain",
      });
      const fileInput = screen.getByTestId("file")
      const preventDefault = jest.fn()
      const windowAlertMock = jest.fn()
      window.alert = windowAlertMock
      const event = {
        preventDefault,
        target:{files: [file]}
      }
      
      const handleChangeFileMock = jest.fn((e) => newBill.handleChangeFile(event))
      
      fileInput.addEventListener('change', handleChangeFileMock);
      fireEvent.change(fileInput, event);
      
      expect(window.alert).toHaveBeenCalledWith("L'extension de fichier choisi n'est pas valide.\nSeuls les fichiers au format JPG, JPEG PNG sont accéptés");
      expect(fileInput.value).toBe('')
      expect(handleChangeFileMock).toHaveBeenCalled()
    })
    test("Then a correctly formatted file will be accepted",  async () => {
      const newBill = new NewBill({
        document, onNavigate, store: mockStore,localStorage: window.localStorage
      })

      const file = new File(["foo"], "testPng.png", {
        type: "image/png",
      });
      const fileInput = screen.getByTestId("file")
      const preventDefault = jest.fn()
      const windowAlertMock = jest.fn()
      window.alert = windowAlertMock
      const event = {
        preventDefault,
        target:{files: [file]}
      }

      const handleChangeFileMock = jest.fn((e) => newBill.handleChangeFile(event))
      
      fileInput.addEventListener('change', handleChangeFileMock);
      await waitFor (() => fireEvent.change(fileInput, event));
      
      expect(newBill.fileName).toBe("testPng.png");
      expect(window.alert).not.toHaveBeenCalled();
      expect(handleChangeFileMock).toHaveBeenCalled()
    })
    test("Then the new bill must be submited",() => {
      const newBill = new NewBill({
        document, onNavigate, store: mockStore,localStorage: window.localStorage
      })

      const handleSubmitMock = jest.fn((e) => newBill.handleSubmit(e))
      const newBillForm = screen.getByTestId("form-new-bill")
      newBillForm.addEventListener("submit", handleSubmitMock)

      fireEvent.submit(newBillForm)
      expect(handleSubmitMock).toHaveBeenCalled()
    })
  })
})
describe("API error", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");
    jest.spyOn(console, "error");
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      }),
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });
  test("POST => API fails with 404 message error", async () => {
    const create = mockStore.bills.mockImplementationOnce(() => {
      return {
        create: () => {
          return Promise.reject(new Error("Erreur 404"));
        },
      };
    });

    window.onNavigate(ROUTES_PATH.NewBill);
    expect(create).toHaveBeenCalled();
    await new Promise(process.nextTick);
    expect(console.error).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(Error("Erreur 404"));
  });
  test("POST => API fails with 500 message error", async () => {
    const create = mockStore.bills.mockImplementationOnce(() => {
      return {
        create: () => {
          return Promise.reject(new Error("Erreur 500"));
        },
      };
    });

    window.onNavigate(ROUTES_PATH.NewBill);		
    expect(create).toHaveBeenCalled();
    await new Promise(process.nextTick);
    expect(console.error).toHaveBeenCalledWith(Error("Erreur 500"));
  });
})
