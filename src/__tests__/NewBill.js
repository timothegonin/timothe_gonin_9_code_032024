/**
 * @jest-environment jsdom
 */

import { screen , waitFor} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES_PATH} from "../constants/routes.js";
import userEvent from "@testing-library/user-event";
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
        document, onNavigate, store: null,localStorage: window.localStorage
      })
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      jest.spyOn(window, 'alert').mockImplementation(() => {});

      const fileInput = screen.getByTestId("file")
      const file = new File(["foo"], "foo.txt", {
        type: "text/plain",
      });
      fileInput.addEventListener('change', handleChangeFile);
      userEvent.upload(fileInput, file);
      
      expect(window.alert).toHaveBeenCalledWith("L'extension de fichier choisi n'est pas valide.\nSeuls les fichiers au format JPG, JPEG PNG sont accéptés");
      expect(fileInput.value).toBe('')
      expect(handleChangeFile).toHaveBeenCalled()
    })
    test("Then a correctly formatted file will be accepted and create a new bill",  () => {
      const newBill = new NewBill({
        document, onNavigate, store: null,localStorage: window.localStorage
      })
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const mockCreate = jest.spyOn(mockStore.bills(), 'create').mockImplementationOnce(() =>
        Promise.resolve({ fileUrl: 'https://localhost:3456/images/test.jpg', key: '1234' })
      );

      const fileInput = screen.getByTestId("file")
      const file = new File(["foo"], "foo.png", {
        type: "image/png",
      });
      fileInput.addEventListener('change', handleChangeFile);
      userEvent.upload(fileInput, file);
      
      expect(mockCreate).toHaveBeenCalled;
      expect(fileInput.value).toBe('')
      expect(handleChangeFile).toHaveBeenCalled()
    })
  })
})
