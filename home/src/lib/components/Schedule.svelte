<script lang="ts">

</script>

<div class="schedule">
    <table>
        <tr>
            <th>Event</th>
            <th>Time</th>
        </tr>
        <tr>
            <td>Opening Ceremony</td>
            <td>9:40 - 9:55</td>
        </tr>
        <tr>
            <td>Round Robin 1</td>
            <td>10:00 - 10:40</td>
        </tr>
        <tr>
            <td>Round Robin 2</td>
            <td>10:45 - 11:25</td>
        </tr>
        <tr>
            <td>Round Robin 3</td>
            <td>11:30 - 12:10</td>
        </tr>
        <tr>
            <td>Round Robin 4</td>
            <td>12:15 - 12:55</td>
        </tr>
        <tr>
            <td>Round Robin 5</td>
            <td>1:00 - 1:40</td>
        </tr>
        <tr>
            <td>Lunch</td>
            <td>1:45 - 2:45</td>
        </tr>
    </table>
    <table>
        <tr>
            <th>Event</th>
            <th>Time</th>
        </tr>
        <tr>
            <td>DE 6</td>
            <td>2:50 - 3:20</td>
        </tr>
        <tr>
            <td>DE 7</td>
            <td>3:25 - 3:55</td>
        </tr>
        <tr>
            <td>DE 8</td>
            <td>4:00 - 4:30</td>
        </tr>
        <tr>
            <td>DE 9</td>
            <td>4:35 - 5:05</td>
        </tr>
        <tr>
            <td>DE 10</td>
            <td>5:10 - 5:40</td>
        </tr>
        <tr>
            <td>DE 11 (Semifinals)</td>
            <td>5:45 - 6:15</td>
        </tr>
        <tr>
            <td>DE 12 (Finals)</td>
            <td>6:20 - 6:50</td>
        </tr>
        <tr>
            <td>Closing and Awards</td>
            <td>7:00 - 7:15</td>
        </tr>
    </table>
</div>

<style lang="scss">
    .schedule {
        display: flex;
        flex-direction: row;
        gap: 40px;
        flex-wrap: wrap;
        max-width: 90vw;
        margin: auto;
        justify-content: center;
    }

    table, th, td {
        border: 1px solid white;
        border-collapse: collapse;
    }

    th {
        font-weight: bold;
        padding: 0.3em 0.6em;
        font-size: 22px;
    }

    td {
        padding: 0.3em 0.6em;
        font-size: 18px;
    }
</style>