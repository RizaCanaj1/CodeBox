// First path SEGMENT only — see puzzle.js for why (this page is two
// segments deep, /puzzle/bug-hunter, but the nav's data-type is "Puzzle").
let firstSegment = window.location.pathname.split('/').filter(Boolean)[0] || ''
let path = firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
let actived = document.querySelector(`a[data-type="${path}"]`)
if(actived){
    actived.classList.add('active')
    actived.addEventListener('click', e=>{
        e.preventDefault();
    });
}
const codeBoxLogo = document.querySelector('.CodeBox')
if(codeBoxLogo){
    codeBoxLogo.addEventListener('click',()=>{
        window.location.href='../dashboard'
    })
}

// ---------- Bug Hunter v3 ----------
// Every language ships TWO curated projects now (picked randomly each game)
// so a shared "here's the fixed code" cheat sheet only works about half the
// time instead of always. Still fully client-side content (no real
// interpreter) — each bug is detected by testing the live file text against
// a regex that only matches once the actual fix is present. A
// stylistically-different-but-equally-correct fix that doesn't match the
// expected pattern won't register; that's an accepted limitation of a
// pattern-matched checker, not a real compiler.
const PROJECTS = {
    javascript: [
        { // Task Tracker
            files: [
                { name: 'tasks.js', mode: 'javascript', content:
`let tasks = [];

function addTask(title) {
  tasks.push({ title: title, done: false });
}

function removeTask(index) {
  tasks.splice(index, 0);
}

function toggleTask(index) {
  tasks[index].done = tasks[index].done;
}

function getTasks() {
  return tasks;
}` },
                { name: 'utils.js', mode: 'javascript', content:
`function countDone(taskList) {
  let count = 0;
  for (let i = 0; i <= taskList.length; i++) {
    if (taskList[i].done) count++;
  }
  return count;
}

function formatTitle(title) {
  return title.trim().toUpperCase();
}

function isValidTitle(title) {
  return title.length >= 0;
}` },
                { name: 'app.js', mode: 'javascript', content:
`function init() {
  const input = document.getElementById('new-task');
  const button = document.getElementById('add-btn');

  button.addEventListener('click', () => {
    addTask(input.value);
    input.value = '';
    render();
  });
}

function render() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  getTasks().forEach((task, index) => {
    const li = document.createElement('li');
    li.textContent = task.title;
    li.onclick = () => toggleTask(i);
    list.appendChild(li);
  });
  const summary = document.getElementById('summary');
  summary.textContent = countDone(getTasks()) + ' done';
}` },
            ],
            bugs: [
                { id: 'js-toggle', file: 'tasks.js', difficulty: 'easy', fixed: /tasks\[index\]\.done = !tasks\[index\]\.done;/ },
                { id: 'js-valid', file: 'utils.js', difficulty: 'easy', fixed: /title\.length > 0/ },
                { id: 'js-loop', file: 'utils.js', difficulty: 'medium', fixed: /i < taskList\.length/ },
                { id: 'js-init', file: 'app.js', difficulty: 'medium', fixed: /^\s*init\(\);\s*$/m },
                { id: 'js-remove', file: 'tasks.js', difficulty: 'hard', fixed: /tasks\.splice\(index, 1\);/ },
                { id: 'js-onclick', file: 'app.js', difficulty: 'hard', fixed: /li\.onclick\s*=\s*\(\)\s*=>\s*\{[^}]*toggleTask\(index\)[^}]*render\(\)[^}]*\}/ },
            ],
        },
        { // Shopping Cart
            files: [
                { name: 'cart.js', mode: 'javascript', content:
`let cart = [];

function addItem(name, price) {
  cart.push({ name: name, price: price, qty: 1 });
}

function removeItem(index) {
  cart.splice(index, 2);
}

function increaseQty(index) {
  cart[index].qty = cart[index].qty;
}

function getCart() {
  return cart;
}` },
                { name: 'pricing.js', mode: 'javascript', content:
`function subtotal(cartItems) {
  let total = 0;
  for (let i = 0; i <= cartItems.length; i++) {
    total += cartItems[i].price * cartItems[i].qty;
  }
  return total;
}

function formatPrice(amount) {
  return '$' + amount.toFixed(2);
}

function isValidPrice(price) {
  return price >= -1;
}` },
                { name: 'checkout.js', mode: 'javascript', content:
`function checkout() {
  const items = getCart();
  const total = subtotal(items);
  const summary = document.getElementById('summary');
  summary.textContent = items.length === 0 ? formatPrice(total) : 'Empty cart';
}

function bindCheckoutButton() {
  const btn = document.getElementById('checkout-btn');
  btn.addEventListener('click', () => {
    checkout();
  });
}` },
            ],
            bugs: [
                { id: 'cart-qty', file: 'cart.js', difficulty: 'easy', fixed: /cart\[index\]\.qty = cart\[index\]\.qty \+ 1;/ },
                { id: 'pricing-valid', file: 'pricing.js', difficulty: 'easy', fixed: /price > 0/ },
                { id: 'pricing-loop', file: 'pricing.js', difficulty: 'medium', fixed: /i < cartItems\.length/ },
                { id: 'checkout-bind', file: 'checkout.js', difficulty: 'medium', fixed: /^\s*bindCheckoutButton\(\);\s*$/m },
                { id: 'cart-remove', file: 'cart.js', difficulty: 'hard', fixed: /cart\.splice\(index, 1\);/ },
                { id: 'checkout-ternary', file: 'checkout.js', difficulty: 'hard', fixed: /items\.length === 0 \? 'Empty cart' : formatPrice\(total\)/ },
            ],
        },
    ],
    node: [
        { // Task Tracker
            files: [
                { name: 'tasks.js', mode: 'javascript', content:
`let tasks = [];

function addTask(title) {
  tasks.push({ title: title, done: false });
}

function removeTask(index) {
  tasks.splice(index, 0);
}

function toggleTask(index) {
  tasks[index].done = tasks[index].done;
}

function getTasks() {
  return tasks;
}

module.exports = { addTask, removeTask, toggleTask, getTasks };` },
                { name: 'utils.js', mode: 'javascript', content:
`function countDone(taskList) {
  let count = 0;
  for (let i = 0; i <= taskList.length; i++) {
    if (taskList[i].done) count++;
  }
  return count;
}

function formatTitle(title) {
  return title.trim().toUpperCase();
}

function isValidTitle(title) {
  return title.length >= 0;
}

module.exports = { countDone, formatTitle, isValidTitle };` },
                { name: 'index.js', mode: 'javascript', content:
`const { addTask, toggleTask, getTasks } = require('./tasks');
const { countDone, formatTitle } = require('./utils');

function main() {
  addTask(formatTitle('Write tests'));
  addTask(formatTitle('Fix bug'));
  toggleTask(0);

  getTasks().forEach((task) => {
    const status = task.done ? ' ' : 'x';
    console.log('[' + status + '] ' + task.title);
  });

  console.log(countDone(getTasks()), 'done');
}` },
            ],
            bugs: [
                { id: 'node-toggle', file: 'tasks.js', difficulty: 'easy', fixed: /tasks\[index\]\.done = !tasks\[index\]\.done;/ },
                { id: 'node-valid', file: 'utils.js', difficulty: 'easy', fixed: /title\.length > 0/ },
                { id: 'node-loop', file: 'utils.js', difficulty: 'medium', fixed: /i < taskList\.length/ },
                { id: 'node-main', file: 'index.js', difficulty: 'medium', fixed: /^\s*main\(\);\s*$/m },
                { id: 'node-remove', file: 'tasks.js', difficulty: 'hard', fixed: /tasks\.splice\(index, 1\);/ },
                { id: 'node-status', file: 'index.js', difficulty: 'hard', fixed: /task\.done \? 'x' : ' '/ },
            ],
        },
        { // Shopping Cart
            files: [
                { name: 'cart.js', mode: 'javascript', content:
`let cart = [];

function addItem(name, price) {
  cart.push({ name: name, price: price, qty: 1 });
}

function removeItem(index) {
  cart.splice(index, 2);
}

function increaseQty(index) {
  cart[index].qty = cart[index].qty;
}

function getCart() {
  return cart;
}

module.exports = { addItem, removeItem, increaseQty, getCart };` },
                { name: 'pricing.js', mode: 'javascript', content:
`function subtotal(cartItems) {
  let total = 0;
  for (let i = 0; i <= cartItems.length; i++) {
    total += cartItems[i].price * cartItems[i].qty;
  }
  return total;
}

function formatPrice(amount) {
  return '$' + amount.toFixed(2);
}

function isValidPrice(price) {
  return price >= -1;
}

module.exports = { subtotal, formatPrice, isValidPrice };` },
                { name: 'checkout.js', mode: 'javascript', content:
`const { getCart } = require('./cart');
const { subtotal, formatPrice } = require('./pricing');

function checkout() {
  const items = getCart();
  const total = subtotal(items);
  console.log(items.length === 0 ? formatPrice(total) : 'Empty cart');
}` },
            ],
            bugs: [
                { id: 'ncart-qty', file: 'cart.js', difficulty: 'easy', fixed: /cart\[index\]\.qty = cart\[index\]\.qty \+ 1;/ },
                { id: 'npricing-valid', file: 'pricing.js', difficulty: 'easy', fixed: /price > 0/ },
                { id: 'npricing-loop', file: 'pricing.js', difficulty: 'medium', fixed: /i < cartItems\.length/ },
                { id: 'ncheckout-call', file: 'checkout.js', difficulty: 'medium', fixed: /^\s*checkout\(\);\s*$/m },
                { id: 'ncart-remove', file: 'cart.js', difficulty: 'hard', fixed: /cart\.splice\(index, 1\);/ },
                { id: 'ncheckout-ternary', file: 'checkout.js', difficulty: 'hard', fixed: /items\.length === 0 \? 'Empty cart' : formatPrice\(total\)/ },
            ],
        },
    ],
    python: [
        { // Task Tracker
            files: [
                { name: 'tasks.py', mode: 'python', content:
`tasks = []

def add_task(title):
    tasks.append({"title": title, "done": False})

def remove_task(index):
    del tasks[index + 1]

def toggle_task(index):
    tasks[index]["done"] = tasks[index]["done"]

def get_tasks():
    return tasks` },
                { name: 'utils.py', mode: 'python', content:
`def count_done(task_list):
    count = 0
    for i in range(len(task_list) + 1):
        if task_list[i]["done"]:
            count += 1
    return count

def format_title(title):
    return title.strip().upper()

def is_valid_title(title):
    return len(title) >= 0` },
                { name: 'app.py', mode: 'python', content:
`from tasks import add_task, remove_task, toggle_task, get_tasks
from utils import count_done, format_title, is_valid_title

def main():
    add_task(format_title("Write tests"))
    add_task(format_title("Fix bug"))
    toggle_task(0)

    for index, task in enumerate(get_tasks()):
        status = "x" if not task["done"] else " "
        print(f"[{status}] {task['title']}")

    print(count_done(get_tasks()), "done")` },
            ],
            bugs: [
                { id: 'py-toggle', file: 'tasks.py', difficulty: 'easy', fixed: /tasks\[index\]\["done"\] = not tasks\[index\]\["done"\]/ },
                { id: 'py-valid', file: 'utils.py', difficulty: 'easy', fixed: /len\(title\) > 0/ },
                { id: 'py-loop', file: 'utils.py', difficulty: 'medium', fixed: /range\(len\(task_list\)\)/ },
                { id: 'py-main', file: 'app.py', difficulty: 'medium', fixed: /^\s*main\(\)\s*$/m },
                { id: 'py-remove', file: 'tasks.py', difficulty: 'hard', fixed: /del tasks\[index\]/ },
                { id: 'py-status', file: 'app.py', difficulty: 'hard', fixed: /if task\["done"\]/ },
            ],
        },
        { // Shopping Cart
            files: [
                { name: 'cart.py', mode: 'python', content:
`cart = []

def add_item(name, price):
    cart.append({"name": name, "price": price, "qty": 1})

def remove_item(index):
    del cart[index + 1]

def increase_qty(index):
    cart[index]["qty"] = cart[index]["qty"]

def get_cart():
    return cart` },
                { name: 'pricing.py', mode: 'python', content:
`def subtotal(cart_items):
    total = 0
    for i in range(len(cart_items) + 1):
        total += cart_items[i]["price"] * cart_items[i]["qty"]
    return total

def format_price(amount):
    return "$" + format(amount, ".2f")

def is_valid_price(price):
    return price >= -1` },
                { name: 'checkout.py', mode: 'python', content:
`from cart import get_cart
from pricing import subtotal, format_price

def checkout():
    items = get_cart()
    total = subtotal(items)
    print(format_price(total) if len(items) == 0 else "Empty cart")` },
            ],
            bugs: [
                { id: 'pcart-qty', file: 'cart.py', difficulty: 'easy', fixed: /cart\[index\]\["qty"\] = cart\[index\]\["qty"\] \+ 1/ },
                { id: 'ppricing-valid', file: 'pricing.py', difficulty: 'easy', fixed: /price > 0/ },
                { id: 'ppricing-loop', file: 'pricing.py', difficulty: 'medium', fixed: /range\(len\(cart_items\)\)/ },
                { id: 'pcheckout-call', file: 'checkout.py', difficulty: 'medium', fixed: /^\s*checkout\(\)\s*$/m },
                { id: 'pcart-remove', file: 'cart.py', difficulty: 'hard', fixed: /del cart\[index\]/ },
                { id: 'pcheckout-ternary', file: 'checkout.py', difficulty: 'hard', fixed: /print\("Empty cart" if len\(items\) == 0 else format_price\(total\)\)/ },
            ],
        },
    ],
    php: [
        { // Task Tracker
            files: [
                { name: 'Tasks.php', mode: 'php', content:
`<?php
$tasks = [];

function addTask($title) {
    global $tasks;
    $tasks[] = ["title" => $title, "done" => false];
}

function removeTask($index) {
    global $tasks;
    unset($tasks[$index + 1]);
}

function toggleTask($index) {
    global $tasks;
    $tasks[$index]["done"] = $tasks[$index]["done"];
}

function getTasks() {
    global $tasks;
    return $tasks;
}` },
                { name: 'Utils.php', mode: 'php', content:
`<?php
function countDone($tasks) {
    $count = 0;
    for ($i = 0; $i <= count($tasks); $i++) {
        if ($tasks[$i]["done"]) $count++;
    }
    return $count;
}

function formatTitle($title) {
    return strtoupper(trim($title));
}

function isValidTitle($title) {
    return strlen($title) >= 0;
}` },
                { name: 'app.php', mode: 'php', content:
`<?php
require 'Tasks.php';
require 'Utils.php';

function run() {
    addTask(formatTitle("Write tests"));
    addTask(formatTitle("Fix bug"));
    toggleTask(0);

    foreach (getTasks() as $index => $task) {
        $status = $task["done"] ? " " : "x";
        echo "[$status] {$task['title']}\\n";
    }

    echo countDone(getTasks()) . " done\\n";
}` },
            ],
            bugs: [
                { id: 'php-toggle', file: 'Tasks.php', difficulty: 'easy', fixed: /\$tasks\[\$index\]\["done"\] = !\$tasks\[\$index\]\["done"\];/ },
                { id: 'php-valid', file: 'Utils.php', difficulty: 'easy', fixed: /strlen\(\$title\) > 0/ },
                { id: 'php-loop', file: 'Utils.php', difficulty: 'medium', fixed: /\$i < count\(\$tasks\)/ },
                { id: 'php-run', file: 'app.php', difficulty: 'medium', fixed: /^\s*run\(\);\s*$/m },
                { id: 'php-remove', file: 'Tasks.php', difficulty: 'hard', fixed: /unset\(\$tasks\[\$index\]\);/ },
                { id: 'php-status', file: 'app.php', difficulty: 'hard', fixed: /\$status = \$task\["done"\] \? "x" : " ";/ },
            ],
        },
        { // Shopping Cart
            files: [
                { name: 'Cart.php', mode: 'php', content:
`<?php
$cart = [];

function addItem($name, $price) {
    global $cart;
    $cart[] = ["name" => $name, "price" => $price, "qty" => 1];
}

function removeItem($index) {
    global $cart;
    unset($cart[$index + 1]);
}

function increaseQty($index) {
    global $cart;
    $cart[$index]["qty"] = $cart[$index]["qty"];
}

function getCart() {
    global $cart;
    return $cart;
}` },
                { name: 'Pricing.php', mode: 'php', content:
`<?php
function subtotal($cartItems) {
    $total = 0;
    for ($i = 0; $i <= count($cartItems); $i++) {
        $total += $cartItems[$i]["price"] * $cartItems[$i]["qty"];
    }
    return $total;
}

function formatPrice($amount) {
    return '$' . number_format($amount, 2);
}

function isValidPrice($price) {
    return $price >= -1;
}` },
                { name: 'checkout.php', mode: 'php', content:
`<?php
require 'Cart.php';
require 'Pricing.php';

function checkout() {
    $items = getCart();
    $total = subtotal($items);
    echo count($items) === 0 ? formatPrice($total) : "Empty cart";
}` },
            ],
            bugs: [
                { id: 'pcpcart-qty', file: 'Cart.php', difficulty: 'easy', fixed: /\$cart\[\$index\]\["qty"\] = \$cart\[\$index\]\["qty"\] \+ 1;/ },
                { id: 'pcppricing-valid', file: 'Pricing.php', difficulty: 'easy', fixed: /\$price > 0/ },
                { id: 'pcppricing-loop', file: 'Pricing.php', difficulty: 'medium', fixed: /\$i < count\(\$cartItems\)/ },
                { id: 'pcpcheckout-run', file: 'checkout.php', difficulty: 'medium', fixed: /^\s*checkout\(\);\s*$/m },
                { id: 'pcpcart-remove', file: 'Cart.php', difficulty: 'hard', fixed: /unset\(\$cart\[\$index\]\);/ },
                { id: 'pcpcheckout-ternary', file: 'checkout.php', difficulty: 'hard', fixed: /echo count\(\$items\) === 0 \? "Empty cart" : formatPrice\(\$total\);/ },
            ],
        },
    ],
    cpp: [
        { // Task Tracker
            files: [
                { name: 'tasks.cpp', mode: 'text/x-c++src', content:
`#include <vector>
#include <string>

struct Task {
    std::string title;
    bool done;
};

std::vector<Task> tasks;

void addTask(std::string title) {
    tasks.push_back({title, false});
}

void removeTask(int index) {
    tasks.erase(tasks.begin() + index + 1);
}

void toggleTask(int index) {
    tasks[index].done = tasks[index].done;
}

std::vector<Task>& getTasks() {
    return tasks;
}` },
                { name: 'utils.cpp', mode: 'text/x-c++src', content:
`#include <vector>
#include <string>
#include <algorithm>
#include "tasks.cpp"

int countDone(std::vector<Task>& taskList) {
    int count = 0;
    for (int i = 0; i <= taskList.size(); i++) {
        if (taskList[i].done) count++;
    }
    return count;
}

std::string formatTitle(std::string title) {
    std::transform(title.begin(), title.end(), title.begin(), ::toupper);
    return title;
}

bool isValidTitle(std::string title) {
    return title.length() >= 0;
}` },
                { name: 'main.cpp', mode: 'text/x-c++src', content:
`#include <iostream>
#include "tasks.cpp"
#include "utils.cpp"

void run() {
    addTask(formatTitle("Write tests"));
    addTask(formatTitle("Fix bug"));
    toggleTask(0);

    for (auto& task : getTasks()) {
        char status = task.done ? ' ' : 'x';
        std::cout << "[" << status << "] " << task.title << std::endl;
    }

    std::cout << countDone(getTasks()) << " done" << std::endl;
}

int main() {
    return 0;
}` },
            ],
            bugs: [
                { id: 'cpp-toggle', file: 'tasks.cpp', difficulty: 'easy', fixed: /tasks\[index\]\.done = !tasks\[index\]\.done;/ },
                { id: 'cpp-valid', file: 'utils.cpp', difficulty: 'easy', fixed: /title\.length\(\) > 0/ },
                { id: 'cpp-loop', file: 'utils.cpp', difficulty: 'medium', fixed: /i < taskList\.size\(\)/ },
                { id: 'cpp-run', file: 'main.cpp', difficulty: 'medium', fixed: /int main\(\)\s*\{\s*run\(\);/ },
                { id: 'cpp-remove', file: 'tasks.cpp', difficulty: 'hard', fixed: /tasks\.erase\(tasks\.begin\(\) \+ index\);/ },
                { id: 'cpp-status', file: 'main.cpp', difficulty: 'hard', fixed: /task\.done \? 'x' : ' '/ },
            ],
        },
        { // Shopping Cart
            files: [
                { name: 'cart.cpp', mode: 'text/x-c++src', content:
`#include <vector>
#include <string>

struct Item {
    std::string name;
    double price;
    int qty;
};

std::vector<Item> cart;

void addItem(std::string name, double price) {
    cart.push_back({name, price, 1});
}

void removeItem(int index) {
    cart.erase(cart.begin() + index, cart.begin() + index + 2);
}

void increaseQty(int index) {
    cart[index].qty = cart[index].qty;
}

std::vector<Item>& getCart() {
    return cart;
}` },
                { name: 'pricing.cpp', mode: 'text/x-c++src', content:
`#include <vector>
#include "cart.cpp"

double subtotal(std::vector<Item>& cartItems) {
    double total = 0;
    for (int i = 0; i <= cartItems.size(); i++) {
        total += cartItems[i].price * cartItems[i].qty;
    }
    return total;
}

std::string formatPrice(double amount) {
    return "$" + std::to_string(amount);
}

bool isValidPrice(double price) {
    return price >= -1;
}` },
                { name: 'checkout.cpp', mode: 'text/x-c++src', content:
`#include <iostream>
#include "cart.cpp"
#include "pricing.cpp"

void checkout() {
    auto items = getCart();
    double total = subtotal(items);
    std::cout << (items.size() == 0 ? formatPrice(total) : "Empty cart") << std::endl;
}

int main() {
    return 0;
}` },
            ],
            bugs: [
                { id: 'ccart-qty', file: 'cart.cpp', difficulty: 'easy', fixed: /cart\[index\]\.qty = cart\[index\]\.qty \+ 1;/ },
                { id: 'cpricing-valid', file: 'pricing.cpp', difficulty: 'easy', fixed: /price > 0/ },
                { id: 'cpricing-loop', file: 'pricing.cpp', difficulty: 'medium', fixed: /i < cartItems\.size\(\)/ },
                { id: 'ccheckout-run', file: 'checkout.cpp', difficulty: 'medium', fixed: /int main\(\)\s*\{\s*checkout\(\);/ },
                { id: 'ccart-remove', file: 'cart.cpp', difficulty: 'hard', fixed: /cart\.erase\(cart\.begin\(\) \+ index\);/ },
                { id: 'ccheckout-ternary', file: 'checkout.cpp', difficulty: 'hard', fixed: /items\.size\(\) == 0 \? "Empty cart" : formatPrice\(total\)/ },
            ],
        },
    ],
    csharp: [
        { // Task Tracker
            files: [
                { name: 'Tasks.cs', mode: 'text/x-csharp', content:
`using System.Collections.Generic;

public class TaskItem {
    public string Title;
    public bool Done;
}

public static class Tasks {
    public static List<TaskItem> tasks = new List<TaskItem>();

    public static void AddTask(string title) {
        tasks.Add(new TaskItem { Title = title, Done = false });
    }

    public static void RemoveTask(int index) {
        tasks.RemoveAt(index + 1);
    }

    public static void ToggleTask(int index) {
        tasks[index].Done = tasks[index].Done;
    }

    public static List<TaskItem> GetTasks() {
        return tasks;
    }
}` },
                { name: 'Utils.cs', mode: 'text/x-csharp', content:
`using System.Collections.Generic;

public static class Utils {
    public static int CountDone(List<TaskItem> taskList) {
        int count = 0;
        for (int i = 0; i <= taskList.Count; i++) {
            if (taskList[i].Done) count++;
        }
        return count;
    }

    public static string FormatTitle(string title) {
        return title.Trim().ToUpper();
    }

    public static bool IsValidTitle(string title) {
        return title.Length >= 0;
    }
}` },
                { name: 'Program.cs', mode: 'text/x-csharp', content:
`using System;

class Program {
    static void Run() {
        Tasks.AddTask(Utils.FormatTitle("Write tests"));
        Tasks.AddTask(Utils.FormatTitle("Fix bug"));
        Tasks.ToggleTask(0);

        foreach (var task in Tasks.GetTasks()) {
            string status = task.Done ? " " : "x";
            Console.WriteLine("[" + status + "] " + task.Title);
        }

        Console.WriteLine(Utils.CountDone(Tasks.GetTasks()) + " done");
    }

    static void Main(string[] args) {
    }
}` },
            ],
            bugs: [
                { id: 'cs-toggle', file: 'Tasks.cs', difficulty: 'easy', fixed: /tasks\[index\]\.Done = !tasks\[index\]\.Done;/ },
                { id: 'cs-valid', file: 'Utils.cs', difficulty: 'easy', fixed: /title\.Length > 0/ },
                { id: 'cs-loop', file: 'Utils.cs', difficulty: 'medium', fixed: /i < taskList\.Count/ },
                { id: 'cs-run', file: 'Program.cs', difficulty: 'medium', fixed: /static void Main\(string\[\] args\)\s*\{\s*Run\(\);/ },
                { id: 'cs-remove', file: 'Tasks.cs', difficulty: 'hard', fixed: /tasks\.RemoveAt\(index\);/ },
                { id: 'cs-status', file: 'Program.cs', difficulty: 'hard', fixed: /task\.Done \? "x" : " "/ },
            ],
        },
        { // Shopping Cart
            files: [
                { name: 'Cart.cs', mode: 'text/x-csharp', content:
`using System.Collections.Generic;

public class Item {
    public string Name;
    public double Price;
    public int Qty;
}

public static class Cart {
    public static List<Item> cart = new List<Item>();

    public static void AddItem(string name, double price) {
        cart.Add(new Item { Name = name, Price = price, Qty = 1 });
    }

    public static void RemoveItem(int index) {
        cart.RemoveRange(index, 2);
    }

    public static void IncreaseQty(int index) {
        cart[index].Qty = cart[index].Qty;
    }

    public static List<Item> GetCart() {
        return cart;
    }
}` },
                { name: 'Pricing.cs', mode: 'text/x-csharp', content:
`using System.Collections.Generic;

public static class Pricing {
    public static double Subtotal(List<Item> cartItems) {
        double total = 0;
        for (int i = 0; i <= cartItems.Count; i++) {
            total += cartItems[i].Price * cartItems[i].Qty;
        }
        return total;
    }

    public static string FormatPrice(double amount) {
        return "$" + amount.ToString("F2");
    }

    public static bool IsValidPrice(double price) {
        return price >= -1;
    }
}` },
                { name: 'Checkout.cs', mode: 'text/x-csharp', content:
`using System;

class Checkout {
    static void Run() {
        var items = Cart.GetCart();
        double total = Pricing.Subtotal(items);
        Console.WriteLine(items.Count == 0 ? Pricing.FormatPrice(total) : "Empty cart");
    }

    static void Main(string[] args) {
    }
}` },
            ],
            bugs: [
                { id: 'cscart-qty', file: 'Cart.cs', difficulty: 'easy', fixed: /cart\[index\]\.Qty = cart\[index\]\.Qty \+ 1;/ },
                { id: 'cspricing-valid', file: 'Pricing.cs', difficulty: 'easy', fixed: /price > 0/ },
                { id: 'cspricing-loop', file: 'Pricing.cs', difficulty: 'medium', fixed: /i < cartItems\.Count/ },
                { id: 'cscheckout-run', file: 'Checkout.cs', difficulty: 'medium', fixed: /static void Main\(string\[\] args\)\s*\{\s*Run\(\);/ },
                { id: 'cscart-remove', file: 'Cart.cs', difficulty: 'hard', fixed: /cart\.RemoveAt\(index\);/ },
                { id: 'cscheckout-ternary', file: 'Checkout.cs', difficulty: 'hard', fixed: /items\.Count == 0 \? "Empty cart" : Pricing\.FormatPrice\(total\)/ },
            ],
        },
    ],
    java: [
        { // Task Tracker
            files: [
                { name: 'Tasks.java', mode: 'text/x-java', content:
`import java.util.ArrayList;
import java.util.List;

class TaskItem {
    String title;
    boolean done;
    TaskItem(String title, boolean done) {
        this.title = title;
        this.done = done;
    }
}

class Tasks {
    static List<TaskItem> tasks = new ArrayList<>();

    static void addTask(String title) {
        tasks.add(new TaskItem(title, false));
    }

    static void removeTask(int index) {
        tasks.remove(index + 1);
    }

    static void toggleTask(int index) {
        tasks.get(index).done = tasks.get(index).done;
    }

    static List<TaskItem> getTasks() {
        return tasks;
    }
}` },
                { name: 'Utils.java', mode: 'text/x-java', content:
`import java.util.List;

class Utils {
    static int countDone(List<TaskItem> taskList) {
        int count = 0;
        for (int i = 0; i <= taskList.size(); i++) {
            if (taskList.get(i).done) count++;
        }
        return count;
    }

    static String formatTitle(String title) {
        return title.trim().toUpperCase();
    }

    static boolean isValidTitle(String title) {
        return title.length() >= 0;
    }
}` },
                { name: 'Main.java', mode: 'text/x-java', content:
`public class Main {
    static void run() {
        Tasks.addTask(Utils.formatTitle("Write tests"));
        Tasks.addTask(Utils.formatTitle("Fix bug"));
        Tasks.toggleTask(0);

        for (TaskItem task : Tasks.getTasks()) {
            String status = task.done ? " " : "x";
            System.out.println("[" + status + "] " + task.title);
        }

        System.out.println(Utils.countDone(Tasks.getTasks()) + " done");
    }

    public static void main(String[] args) {
    }
}` },
            ],
            bugs: [
                { id: 'java-toggle', file: 'Tasks.java', difficulty: 'easy', fixed: /tasks\.get\(index\)\.done = !tasks\.get\(index\)\.done;/ },
                { id: 'java-valid', file: 'Utils.java', difficulty: 'easy', fixed: /title\.length\(\) > 0/ },
                { id: 'java-loop', file: 'Utils.java', difficulty: 'medium', fixed: /i < taskList\.size\(\)/ },
                { id: 'java-run', file: 'Main.java', difficulty: 'medium', fixed: /public static void main\(String\[\] args\)\s*\{\s*run\(\);/ },
                { id: 'java-remove', file: 'Tasks.java', difficulty: 'hard', fixed: /tasks\.remove\(index\);/ },
                { id: 'java-status', file: 'Main.java', difficulty: 'hard', fixed: /task\.done \? "x" : " "/ },
            ],
        },
        { // Shopping Cart
            files: [
                { name: 'Cart.java', mode: 'text/x-java', content:
`import java.util.ArrayList;
import java.util.List;

class Item {
    String name;
    double price;
    int qty;
    Item(String name, double price, int qty) {
        this.name = name;
        this.price = price;
        this.qty = qty;
    }
}

class Cart {
    static List<Item> cart = new ArrayList<>();

    static void addItem(String name, double price) {
        cart.add(new Item(name, price, 1));
    }

    static void removeItem(int index) {
        cart.remove(index + 1);
    }

    static void increaseQty(int index) {
        cart.get(index).qty = cart.get(index).qty;
    }

    static List<Item> getCart() {
        return cart;
    }
}` },
                { name: 'Pricing.java', mode: 'text/x-java', content:
`import java.util.List;

class Pricing {
    static double subtotal(List<Item> cartItems) {
        double total = 0;
        for (int i = 0; i <= cartItems.size(); i++) {
            total += cartItems.get(i).price * cartItems.get(i).qty;
        }
        return total;
    }

    static String formatPrice(double amount) {
        return String.format("$%.2f", amount);
    }

    static boolean isValidPrice(double price) {
        return price >= -1;
    }
}` },
                { name: 'Checkout.java', mode: 'text/x-java', content:
`public class Checkout {
    static void run() {
        var items = Cart.getCart();
        double total = Pricing.subtotal(items);
        System.out.println(items.size() == 0 ? Pricing.formatPrice(total) : "Empty cart");
    }

    public static void main(String[] args) {
    }
}` },
            ],
            bugs: [
                { id: 'jcart-qty', file: 'Cart.java', difficulty: 'easy', fixed: /cart\.get\(index\)\.qty = cart\.get\(index\)\.qty \+ 1;/ },
                { id: 'jpricing-valid', file: 'Pricing.java', difficulty: 'easy', fixed: /price > 0/ },
                { id: 'jpricing-loop', file: 'Pricing.java', difficulty: 'medium', fixed: /i < cartItems\.size\(\)/ },
                { id: 'jcheckout-run', file: 'Checkout.java', difficulty: 'medium', fixed: /public static void main\(String\[\] args\)\s*\{\s*run\(\);/ },
                { id: 'jcart-remove', file: 'Cart.java', difficulty: 'hard', fixed: /cart\.remove\(index\);/ },
                { id: 'jcheckout-ternary', file: 'Checkout.java', difficulty: 'hard', fixed: /items\.size\(\) == 0 \? "Empty cart" : Pricing\.formatPrice\(total\)/ },
            ],
        },
    ],
}

// Damage per attack now scales with how many bugs are still unresolved —
// the more you let pile up, the harder each hit lands. Fixing bugs as you
// go (they die the instant a fix is detected, no button needed) directly
// shrinks the next hit.
// Non-cumulative on purpose — medium used to also pull in easy's bugs
// (4 = 2 easy + 2 medium) and hard pulled in both lower tiers (6 = 2+2+2),
// so picking a harder difficulty silently showed MORE bugs than its own
// label promised, and easy's bugs were always a subset of every run. Each
// difficulty now only pulls its own tag — exactly 2 bugs, always.
const DIFFICULTY_SETTINGS = {
    easy:   { tiers: ['easy'], attackSeconds: 90, damagePerBug: 2 },
    medium: { tiers: ['medium'], attackSeconds: 65, damagePerBug: 3 },
    hard:   { tiers: ['hard'], attackSeconds: 45, damagePerBug: 4 },
}
const BUG_POINTS = { easy: 30, medium: 50, hard: 80 }
const MONITOR_EXPAND_MS = 850
const LIVE_CHECK_DEBOUNCE_MS = 400
const TOTAL_COMBOS = Object.keys(PROJECTS).length * Object.keys(DIFFICULTY_SETTINGS).length

// Hand-built pixel-art bug (not an emoji) — a flat grid of <rect>s so it
// reads as a blocky "sprite" rather than a smooth icon. Colored via
// currentColor + a per-instance hue-rotate (see .bh-crawler.species-N in
// the CSS) so a handful of these on screen at once read as different bugs
// without needing separate art per species.
const BH_BUG_SVG = `<svg viewBox="0 0 11 8" class="bh-bug-svg" shape-rendering="crispEdges">
    <rect x="3" y="0" width="1" height="1" fill="currentColor"/>
    <rect x="7" y="0" width="1" height="1" fill="currentColor"/>
    <rect x="4" y="1" width="3" height="1" fill="currentColor"/>
    <rect x="2" y="2" width="7" height="1" fill="currentColor"/>
    <rect x="0" y="3" width="11" height="1" fill="currentColor"/>
    <rect x="0" y="4" width="11" height="1" fill="currentColor"/>
    <rect x="2" y="5" width="7" height="1" fill="currentColor"/>
    <rect x="3" y="6" width="5" height="1" fill="currentColor"/>
    <rect x="4" y="7" width="3" height="1" fill="currentColor"/>
    <rect x="4" y="1" width="1" height="1" class="bh-bug-eye"/>
    <rect x="6" y="1" width="1" height="1" class="bh-bug-eye"/>
</svg>`

const bh = {
    language: 'javascript',
    difficulty: 'easy',
    activeBugs: [],
    fileDocs: {},
    cm: null,
    health: 100,
    score: 0,
    nextAttackAt: 0,
    attackTimeout: null,
    countdownInterval: null,
    liveCheckTimeouts: {},
    completedCombos: new Set(),
    totalCompleted: 0,
}

function bhEl(id){ return document.getElementById(id) }

function bhEscapeHtml(text){
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
    return String(text).replace(/[&<>"']/g, m => map[m])
}

function bhShowPhase(id){
    document.querySelectorAll('.bh-phase').forEach(p => p.classList.remove('active'))
    bhEl(id).classList.add('active')
}

function bhSetHudVisible(show){
    bhEl('bh-hud').classList.toggle('active', show)
    bhEl('bh-game-footer').classList.toggle('active', show)
}

function bhSetupChoiceGroups(){
    document.querySelectorAll('.bh-choice-group').forEach(group => {
        group.querySelectorAll('.bh-choice').forEach(btn => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('.bh-choice').forEach(b => b.classList.remove('active'))
                btn.classList.add('active')
                if(group.id === 'bh-language-group') bh.language = btn.dataset.value
                if(group.id === 'bh-difficulty-group') bh.difficulty = btn.dataset.value
                bhRefreshBeatenIndicators()
            })
        })
    })
}

// ---------- Progress (persisted server-side, see BugHunterController) ----------
async function bhFetchProgress(){
    try {
        const res = await fetch('../bug-hunter/progress', { headers: { 'Accept': 'application/json' } })
        if(!res.ok) return
        const data = await res.json()
        bh.completedCombos = new Set((data.completed || []).map(c => c.language + ':' + c.difficulty))
        bh.totalCompleted = (data.completed || []).length
        bhRefreshBeatenIndicators()
    } catch(e){ /* progress is a nice-to-have, game still works without it */ }
}

function bhRefreshBeatenIndicators(){
    document.querySelectorAll('#bh-difficulty-group .bh-choice').forEach(btn => {
        const key = bh.language + ':' + btn.dataset.value
        btn.classList.toggle('beaten', bh.completedCombos.has(key))
    })
    const progressEl = bhEl('bh-progress-line')
    if(progressEl) progressEl.textContent = `${bh.totalCompleted}/${TOTAL_COMBOS} combos cleared`
}

async function bhReportCompletion(){
    try {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content
        const res = await fetch('../bug-hunter/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
            body: JSON.stringify({ language: bh.language, difficulty: bh.difficulty, score: bh.score }),
        })
        if(!res.ok) return null
        const data = await res.json()
        bh.completedCombos.add(bh.language + ':' + bh.difficulty)
        bh.totalCompleted = data.total_completed
        bhRefreshBeatenIndicators()
        return data
    } catch(e){ return null }
}

// ---------- Start: grow the monitor, then move into setup ----------
function bhBeginExpand(){
    bhEl('bh-intro-copy').classList.add('bh-fade-out')
    bhEl('bh-monitor').classList.add('expanded')
    setTimeout(() => bhShowPhase('bh-phase-setup'), MONITOR_EXPAND_MS)
}

// ---------- File tabs / editor ----------
function bhBuildTabs(files){
    const tabsEl = bhEl('bh-file-tabs')
    tabsEl.innerHTML = ''
    files.forEach((file, i) => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'bh-file-tab' + (i === 0 ? ' active' : '')
        btn.textContent = file.name
        btn.addEventListener('click', () => {
            tabsEl.querySelectorAll('.bh-file-tab').forEach(t => t.classList.remove('active'))
            btn.classList.add('active')
            bhMountEditor(file.name)
        })
        tabsEl.appendChild(btn)
    })
}

function bhMountEditor(fileName){
    if(!bh.cm){
        bh.cm = CodeMirror(bhEl('bh-editor-cm'), {
            value: '',
            theme: 'codebox',
            lineNumbers: true,
            indentUnit: 4,
            lineWrapping: false,
        })
    }
    bh.cm.swapDoc(bh.fileDocs[fileName])
    bh.cm.refresh()
}

function bhUpdateHud(){
    bhEl('bh-health-fill').style.width = Math.max(0, bh.health) + '%'
    bhEl('bh-score').textContent = bh.score
    bhEl('bh-bugs-left').textContent = bh.activeBugs.filter(b => !b.resolved).length
}

function bhPickProject(language){
    const variants = PROJECTS[language]
    return variants[Math.floor(Math.random() * variants.length)]
}

// ---------- Game lifecycle ----------
function bhStartGame(){
    bhStopTimers()
    const project = bhPickProject(bh.language)
    const settings = DIFFICULTY_SETTINGS[bh.difficulty]

    bh.health = 100
    bh.score = 0
    bh.activeBugs = project.bugs
        .filter(b => settings.tiers.includes(b.difficulty))
        .map(b => ({ ...b, resolved: false, crawlerEl: null, wanderTimeout: null }))

    bh.fileDocs = {}
    project.files.forEach(file => {
        const doc = new CodeMirror.Doc(file.content, file.mode)
        doc.on('change', () => bhScheduleLiveCheck(file.name))
        bh.fileDocs[file.name] = doc
    })

    bhBuildTabs(project.files)
    bhMountEditor(project.files[0].name)
    bhSetLiveFeedback('')
    bhSetHudVisible(true)
    bhUpdateHud()
    bhShowPhase('bh-phase-game')
    if(bh.cm) bh.cm.refresh()

    const layer = bhEl('bh-wander-layer')
    layer.innerHTML = ''
    bh.activeBugs.forEach((bug, i) => bhSpawnWanderer(bug, i))

    bhScheduleNextAttack()
    bhStartCountdownTicker()
}

// Leaving the game screen (Change settings, or navigating back to setup)
// without finishing — stop every in-flight timer and clear the bug layer,
// otherwise old wander/attack loops from an abandoned run keep ticking in
// the background.
function bhAbandonGame(){
    bhStopTimers()
    bh.activeBugs.forEach(bug => { if(bug.crawlerEl) bug.crawlerEl.remove() })
    bh.activeBugs = []
    bhSetHudVisible(false)
}

function bhStopTimers(){
    bh.activeBugs.forEach(bug => clearTimeout(bug.wanderTimeout))
    clearTimeout(bh.attackTimeout)
    clearInterval(bh.countdownInterval)
    Object.values(bh.liveCheckTimeouts).forEach(clearTimeout)
    bh.liveCheckTimeouts = {}
}

// ---------- Wandering ----------
function bhSpawnWanderer(bug, index){
    const layer = bhEl('bh-wander-layer')
    const el = document.createElement('div')
    el.className = 'bh-crawler species-' + ((index % 4) + 1)
    el.innerHTML = BH_BUG_SVG
    layer.appendChild(el)
    bug.crawlerEl = el
    bhPlaceRandom(el)
    bhWanderStep(bug)
}

function bhPlaceRandom(el){
    const layer = el.parentElement
    const maxX = Math.max(0, layer.clientWidth - el.offsetWidth)
    const maxY = Math.max(0, layer.clientHeight - el.offsetHeight)
    el.style.left = (Math.random() * maxX) + 'px'
    el.style.top = (Math.random() * maxY) + 'px'
}

// Slow, aimless drift — a fresh random point every 4-7s. No straight
// march toward anything; this is meant to feel ambient, not urgent.
function bhWanderStep(bug){
    const el = bug.crawlerEl
    if(!el || bug.resolved) return
    const layer = el.parentElement
    const maxX = Math.max(0, layer.clientWidth - el.offsetWidth)
    const maxY = Math.max(0, layer.clientHeight - el.offsetHeight)
    const x = Math.random() * maxX
    const y = Math.random() * maxY
    const duration = 4 + Math.random() * 3
    el.style.transition = `left ${duration}s ease-in-out, top ${duration}s ease-in-out`
    el.style.left = x + 'px'
    el.style.top = y + 'px'
    bug.wanderTimeout = setTimeout(() => bhWanderStep(bug), duration * 1000)
}

// ---------- Attacks ----------
function bhScheduleNextAttack(){
    const settings = DIFFICULTY_SETTINGS[bh.difficulty]
    bh.nextAttackAt = Date.now() + settings.attackSeconds * 1000
    clearTimeout(bh.attackTimeout)
    bh.attackTimeout = setTimeout(bhTriggerAttack, settings.attackSeconds * 1000)
}

function bhTriggerAttack(){
    const candidates = bh.activeBugs.filter(b => !b.resolved && b.crawlerEl)
    if(!candidates.length){ bhScheduleNextAttack(); return }
    const attacker = candidates[Math.floor(Math.random() * candidates.length)]
    bhPlayAttack(attacker)
}

function bhPlayAttack(bug){
    const el = bug.crawlerEl
    clearTimeout(bug.wanderTimeout)
    el.style.transition = 'none'
    el.classList.add('attacking')
    const monitor = bhEl('bh-monitor')
    monitor.classList.add('screen-hit')
    setTimeout(() => {
        const settings = DIFFICULTY_SETTINGS[bh.difficulty]
        const unresolvedCount = Math.max(1, bh.activeBugs.filter(b => !b.resolved).length)
        const damage = settings.damagePerBug * unresolvedCount
        bh.health = Math.max(0, bh.health - damage)
        bhUpdateHud()
        monitor.classList.remove('screen-hit')
        if(bh.health <= 0){
            bhStopTimers()
            bhGameOver()
            return
        }
        if(bug.resolved){ return } // got fixed mid-lunge — don't respawn its wander
        el.classList.remove('attacking')
        bhWanderStep(bug)
        bhScheduleNextAttack()
    }, 700)
}

function bhStartCountdownTicker(){
    clearInterval(bh.countdownInterval)
    const tick = () => {
        const remaining = Math.max(0, Math.round((bh.nextAttackAt - Date.now()) / 1000))
        const m = Math.floor(remaining / 60)
        const s = remaining % 60
        bhEl('bh-next-attack').textContent = `${m}:${String(s).padStart(2, '0')}`
    }
    tick()
    bh.countdownInterval = setInterval(tick, 500)
}

// ---------- Squashing (a bug gets fixed) ----------
function bhSquashCrawler(bug){
    const el = bug.crawlerEl
    if(!el) return
    clearTimeout(bug.wanderTimeout)
    // Freeze it exactly where it visually is instead of letting the
    // in-flight left/top transition keep running while the squash
    // animation plays.
    const rect = el.getBoundingClientRect()
    const layerRect = el.parentElement.getBoundingClientRect()
    el.style.transition = 'none'
    el.style.left = (rect.left - layerRect.left) + 'px'
    el.style.top = (rect.top - layerRect.top) + 'px'
    void el.offsetWidth
    el.classList.add('squashed')
    setTimeout(() => el.remove(), 500)
}

// ---------- Live checking (instant kill — no submit button) ----------
// One debounce timer PER FILE — a single shared timer would let editing
// file B within the debounce window cancel file A's still-pending check,
// silently dropping a fix you already made the moment you switched tabs.
function bhScheduleLiveCheck(fileName){
    clearTimeout(bh.liveCheckTimeouts[fileName])
    bh.liveCheckTimeouts[fileName] = setTimeout(() => bhLiveCheckFile(fileName), LIVE_CHECK_DEBOUNCE_MS)
}

function bhLiveCheckFile(fileName){
    const doc = bh.fileDocs[fileName]
    if(!doc) return
    const text = doc.getValue()
    const newlyFixed = bh.activeBugs.filter(b => !b.resolved && b.file === fileName && b.fixed.test(text))
    if(!newlyFixed.length) return

    newlyFixed.forEach(bug => {
        bug.resolved = true
        bh.score += BUG_POINTS[bug.difficulty]
        bhSquashCrawler(bug)
    })
    bhUpdateHud()

    const remaining = bh.activeBugs.filter(b => !b.resolved).length
    bhSetLiveFeedback(
        remaining === 0
            ? `Last one down!`
            : `Fixed ${newlyFixed.length} bug${newlyFixed.length > 1 ? 's' : ''}! ${remaining} left.`
    )

    if(remaining === 0){
        bhStopTimers()
        bhWin()
    }
}

function bhSetLiveFeedback(text){
    const el = bhEl('bh-live-feedback')
    if(!el) return
    el.textContent = text
    if(text){
        el.classList.remove('bh-feedback-pulse')
        void el.offsetWidth
        el.classList.add('bh-feedback-pulse')
    }
}

async function bhWin(){
    bhEl('bh-win-score').textContent = bh.score
    bhEl('bh-win-health').textContent = Math.max(0, bh.health)
    bhEl('bh-monitor').classList.remove('golden')
    bhEl('bh-win-golden-note').classList.add('d-none')
    bhShowPhase('bh-phase-win')

    const result = await bhReportCompletion()
    if(result && result.all_completed){
        bhEl('bh-monitor').classList.add('golden')
        bhEl('bh-win-golden-note').classList.remove('d-none')
    }
}

function bhGameOver(){
    bhEl('bh-final-score').textContent = bh.score
    bhEl('bh-final-fixed').textContent = bh.activeBugs.filter(b => b.resolved).length
    bhShowPhase('bh-phase-gameover')
}

document.addEventListener('DOMContentLoaded', () => {
    if(!bhEl('bh-monitor')) return // not on the bug-hunter page
    bhSetupChoiceGroups()
    bhFetchProgress()
    bhEl('bh-start-btn').addEventListener('click', () => bhBeginExpand())
    bhEl('bh-begin-btn').addEventListener('click', () => bhStartGame())
    bhEl('bh-retry-btn').addEventListener('click', () => bhStartGame())
    bhEl('bh-change-btn').addEventListener('click', () => { bhAbandonGame(); bhShowPhase('bh-phase-setup') })
    bhEl('bh-win-retry-btn').addEventListener('click', () => bhStartGame())
    bhEl('bh-win-change-btn').addEventListener('click', () => { bhAbandonGame(); bhEl('bh-monitor').classList.remove('golden'); bhShowPhase('bh-phase-setup') })

    // ---------- Upload-challenge (this page only) ----------
    const uploadBtn = bhEl('bh-upload-btn')
    const uploadModal = bhEl('bh-upload-modal')
    if(uploadBtn && uploadModal){
        const closeModal = () => uploadModal.classList.remove('active')
        uploadBtn.addEventListener('click', () => {
            uploadModal.classList.add('active')
            bhLoadMyCourses()
            bhLoadBrowseList()
        })
        bhEl('bh-upload-modal-close')?.addEventListener('click', closeModal)
        uploadModal.addEventListener('click', (e) => { if(e.target === uploadModal) closeModal() })
    }

    // File-upload alternative to pasting — reads straight into the same
    // textarea so the submit payload stays identical either way.
    function bhWireFileInput(fileInputId, textareaId){
        const fileInput = bhEl(fileInputId)
        const textarea = bhEl(textareaId)
        if(!fileInput || !textarea) return
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0]
            if(!file) return
            const reader = new FileReader()
            reader.onload = () => { textarea.value = reader.result }
            reader.readAsText(file)
        })
    }
    bhWireFileInput('bh-upload-bugged-file', 'bh-upload-bugged')
    bhWireFileInput('bh-upload-fixed-file', 'bh-upload-fixed')

    async function bhLoadMyCourses(){
        const row = bhEl('bh-upload-course-row')
        const select = bhEl('bh-upload-course')
        if(!row || !select) return
        try {
            const res = await fetch('../bug-hunter/my-courses', { headers: { 'Accept': 'application/json' } })
            if(!res.ok) return
            const data = await res.json()
            const courses = data.courses || []
            if(!courses.length){ row.classList.add('d-none'); return }
            row.classList.remove('d-none')
            select.innerHTML = '<option value="">Public — anyone with the ID</option>' +
                courses.map(c => `<option value="${c.id}">${bhEscapeHtml(c.name)}</option>`).join('')
        } catch(e){ /* course restriction is optional, fine to skip on failure */ }
    }

    const uploadForm = bhEl('bh-upload-form')
    if(uploadForm){
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const statusEl = bhEl('bh-upload-status')
            const courseVal = bhEl('bh-upload-course')?.value
            const payload = {
                title: bhEl('bh-upload-title').value.trim(),
                language: bhEl('bh-upload-language').value,
                course_id: courseVal ? Number(courseVal) : null,
                bugged_code: bhEl('bh-upload-bugged').value,
                fixed_code: bhEl('bh-upload-fixed').value,
            }
            if(!payload.title || !payload.bugged_code.trim() || !payload.fixed_code.trim()){
                statusEl.textContent = 'Fill in every field first.'
                statusEl.className = 'bh-upload-status bh-upload-error'
                return
            }
            const csrf = document.querySelector('meta[name="csrf-token"]')?.content
            try {
                const res = await fetch('../bug-hunter/submit-challenge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const data = await res.json()
                if(!res.ok){
                    statusEl.textContent = data.message || 'Something went wrong.'
                    statusEl.className = 'bh-upload-status bh-upload-error'
                    return
                }
                statusEl.textContent = data.message
                statusEl.className = 'bh-upload-status bh-upload-good'
                uploadForm.reset()
                bhEl('bh-upload-course-row')?.classList.add('d-none')
                bhLoadMyCourses()
                bhLoadBrowseList()
            } catch(err){
                statusEl.textContent = 'Network error — try again.'
                statusEl.className = 'bh-upload-status bh-upload-error'
            }
        })
    }

    async function bhLoadBrowseList(){
        const listEl = bhEl('bh-browse-list')
        if(!listEl) return
        listEl.innerHTML = '<p class="bh-browse-empty">Loading…</p>'
        try {
            const res = await fetch('../bug-hunter/submissions', { headers: { 'Accept': 'application/json' } })
            if(!res.ok){ listEl.innerHTML = '<p class="bh-browse-empty">Couldn\'t load submissions.</p>'; return }
            const data = await res.json()
            const submissions = data.submissions || []
            if(!submissions.length){ listEl.innerHTML = '<p class="bh-browse-empty">No community challenges yet — be the first.</p>'; return }
            listEl.innerHTML = ''
            submissions.forEach(sub => {
                const row = document.createElement('div')
                row.className = 'bh-browse-row'
                const restricted = sub.course ? ` <span class="bh-browse-restricted"><i class="fa-solid fa-lock"></i> ${bhEscapeHtml(sub.course.name)}</span>` : ''
                row.innerHTML = `
                    <div class="bh-browse-info">
                        <strong>${bhEscapeHtml(sub.title)}</strong>
                        <span class="bh-browse-meta">${bhEscapeHtml(sub.language)} · by ${bhEscapeHtml(sub.user ? sub.user.name : 'someone')}${restricted}</span>
                    </div>
                    <button type="button" class="bh-report-btn" data-id="${sub.id}"><i class="fa-solid fa-flag"></i> Report</button>`
                row.querySelector('.bh-report-btn').addEventListener('click', () => bhReportSubmission(sub.id, row))
                listEl.appendChild(row)
            })
        } catch(e){
            listEl.innerHTML = '<p class="bh-browse-empty">Couldn\'t load submissions.</p>'
        }
    }

    async function bhReportSubmission(id, rowEl){
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content
        try {
            const res = await fetch(`../bug-hunter/report/${id}`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrf, 'Accept': 'application/json' },
            })
            const data = await res.json()
            if(data.removed){
                rowEl.remove()
            } else {
                const btn = rowEl.querySelector('.bh-report-btn')
                btn.textContent = 'Reported'
                btn.disabled = true
            }
        } catch(e){ /* best-effort */ }
    }

    const idForm = bhEl('bh-id-form')
    if(idForm){
        idForm.addEventListener('submit', (e) => {
            e.preventDefault()
            const input = bhEl('bh-id-input')
            const val = input.value.trim()
            if(!val) return
            alert(`Shared puzzles aren't playable yet — "${val}" can't be loaded. Check back soon!`)
            input.value = ''
        })
    }
})
